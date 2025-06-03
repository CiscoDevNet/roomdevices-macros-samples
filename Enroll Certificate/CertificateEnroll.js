/**
 * Enroll a new certificate using SCEP
 * Assign the new certificate a list of purposes
 * Install a CA Certificate for TLS Verification
 */
import xapi from 'xapi'

// Please provide network data.
const url = "" // Required: SCEP server http enroll URL
const ca_fingerprint = ""  // Required: SHA1 fingerprint of signing CA
const common_name = "" // Optional: common name (default to sepmac)
const country_name = "" // Optional: country name
const state_name = "" // Optional: state name
const locality_name = "" // Optional: locality name
const organization_name = "" // Optional: organization name
const organizational_unit = "" // Optional: organization unit
const challenge_password = "" // Recommended: SCEP server shared secret

// Please provide purposes.
// Activates the new certificate for the follow purposes
// (see `xcommand security certificates services activate ??` for description of available purposes)
const purposes = ["802.1X"] // Required 1 or more list of purposes

// Optionally, please provide CA certificate
// Adds a CA certificate to validate server certificates in TLS connections.
// Replace: <PEM> with PEM file contents
const ca_certificate_pem = `
-----BEGIN CERTIFICATE-----
<PEM>
-----END CERTIFICATE-----
.
`

// Number of seconds the device needs to be online
// before attempting SCEP Enrollment 
const requiredUptimeSec = 120;

// Number of seconds between network rechecks
const networkRecheckSec = 60;

// Number of network recheck attempts
const maxNetworkRecheckAttempts = 10;

// Variable to track recheck attempts
let networkattempts = 0;

//
// Helper functions
//
function report_error(error) {
  console.error(error)
}

async function get_sepmac() {
  let macaddr = await xapi.Status.Network[1].Ethernet.MacAddress.get()
  return "sep" + macaddr.toLowerCase().replaceAll(':', '')
}

// Install a CA Certificate to validate the server certificate in TLS connections.
async function install_ca_certificate() {
  const template_char_count = 100 // 62 chars in the template + 38 char leighway
  if (ca_certificate_pem.length > template_char_count) {
    try {
      await xapi.Command.Security.Certificates.CA.Add(ca_certificate_pem)
    } catch(e) {
      report_error(e)
    }
  }
}

// Activate the certificates using the list of purposes defined above.
async function activate_certificate(scep_request_result) {
  for (const purpose of purposes) {
    try {
      await xapi.Command.Security.Certificates.Services.Activate({ Fingerprint: scep_request_result.CertFingerprint, Purpose: purpose })
    } catch(e) {
      report_error(e)
    }
  }
}

// Enroll a new certificate with SCEP.
async function certificate_request() {
  const enrollargs = {}
  enrollargs["URL"] = url
  enrollargs["Fingerprint"] = ca_fingerprint
  if (common_name) {
    enrollargs["CommonName"] = common_name
  } else {
    enrollargs["CommonName"] = await get_sepmac()
  }
  enrollargs["CountryName"] = country_name
  enrollargs["StateOrProvinceName"] = state_name
  enrollargs["LocalityName"] = locality_name
  enrollargs["OrganizationName"] = organization_name
  enrollargs["OrganizationalUnit"] = organizational_unit
  enrollargs["ChallengePassword"] = challenge_password
  console.debug(enrollargs)
  let result = undefined
  try {
    result = await xapi.Command.Security.Certificates.Services.Enrollment.SCEP.Request(enrollargs)
  } catch(e) {
    report_error(e)
  }
  if (result != undefined) {
    console.info("Saved certificate: " + result)
    activate_certificate(result)
  }
}

// Find LSCs already installed on device.
async function find_local_signicificate_certificates() {
  let certificates = await xapi.Command.Security.Certificates.Services.Show()
  let found = false
  if (certificates["Details"].length > 2) {
    await certificates["Details"].forEach((cert) => {
      let issuer = cert["IssuerName"]
      if (!issuer.includes("O=Cisco") &&
        !issuer.includes("O=TemporaryDefaultCertificate")) {
        found = true
      }
    })
  }
  return found
}

/**
 * Init
 *  1) Enroll a new certificate and assign a list of purposes
 *  2) install provide CA Certificates (if any)
 */
async function init() {
  if (!url || !ca_fingerprint || purposes.length == 0) {
    console.error("Url, Fingerprint, and at least 1 purpose is required")
    return
  }

  
  let has_lsc = await find_local_signicificate_certificates();

  if (has_lsc) {
    console.warn("Local certificate already installed")
    return
  } 

  const uptime = parseInt(await xapi.Status.SystemUnit.Uptime.get())

  if (uptime && uptime <= requiredUptimeSec) {
    const waitTime = requiredUptimeSec - uptime;
    const secOrSecs = waitTime == 1 ? 'second' : 'seconds'
    console.log('System not online long enough - waiting:', waitTime, secOrSecs)
    setTimeout(init, waitTime * 1000)
    return
  }

  const ipv4Address = await xapi.Status.Network[1].IPv4.Address.get();
  const ipv6Address = await xapi.Status.Network[1].IPv6.Address.get();

  console.log(ipv4Address, ipv6Address)
  if (ipv4Address == '' && ipv6Address == ''){

    if(networkattempts < maxNetworkRecheckAttempts){
      const secOrSecs = networkRecheckSec == 1 ? 'second' : 'seconds'
      console.warn("No IPv4 or IPv6 Address detected - waiting", networkRecheckSec, secOrSecs)
      setTimeout(init, networkRecheckSec * 1000)
      return
    }

    console.warn("Max Network Attempts Reached")

    return
    
  }

  console.log('System online long enough and network address present - starting SCEP enrollment');

  await certificate_request()
  await install_ca_certificate()
  
}

init()
