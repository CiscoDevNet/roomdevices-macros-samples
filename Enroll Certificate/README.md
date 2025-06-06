# Enroll Certificate

Add Locally Significate Certificate (LSC) using SCEP RFC8894 for Certificate Enrollment.

## Requirements

1. CA/RA with SCEP Server URL
1. CA Fingerprint of the Signing CA Certificate
1. CA Certificates for IEEE 802.1X TlsVerify

## Parameters

NOTE: Any optional parameters not being used should be left alone with the default value to ignore.

1. SCEP Server Url
1. CA Fingerprint
1. Challenge Password - if configured on SCEP Server
1. CSR Distinguished Name (DN) details - /C /ST /L /O /OU /CN
1. Purpose - Usages for the Certificate after being installed.<br>
See [documentation](https://roomos.cisco.com/xapi/Command.Security.Certificates.Services.Activate/) for a list of purposes.
1. CA Certificate PEM - NOTE: The "dot" on final newline is required.

## Limitations

1. Can only be used to install 1 LSC. Macro will not run if any LSC is already installed on device.
1. Can only add up to 3 CA Certificates in BEGIN/END CERTIFICATE blocks (added before the period).
1. Only one Organization Unit can be added since the enrollargs key must be unique.
1. CSR Subject Alt Name (SAN) values (ip: email: dns: uri:) may be added to the script.<br>
If needed, follow the example of the other CSR parameters.

## Support Notice

[Support](http://developer.cisco.com/site/devnet/support) for the macros is provided on a "best effort" basis via DevNet. Like any custom deployment, it is the responsibility of the partner and/or customer to ensure that the customization works correctly and this includes ensuring that the macro is properly integrated into 3rd party applications.

It is Cisco's intention to ensure macro compatibility across versions as much as possible and Cisco will make every effort to clearly document any differences in the xAPI across versions in the event that a backwards compatibility impacting change is made.

Cisco Systems, Inc.<br>
[http://www.cisco.com](http://www.cisco.com)<br>
[http://developer.cisco.com/site/roomdevices](http://developer.cisco.com/site/roomdevices)
