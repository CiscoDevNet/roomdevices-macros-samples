## USB Mode Room Device Compatibility Matrix

### Key
- Native USB: Devices that have USB Passthrough built into their hardware. No need for a macro and highly recommended 😃
- Native Inogeni: Native OS support for USB mode, no macro required. Inogeni 4KX-PLUS Capture device required (future software release)
- Macro 1-3: Original USB Mode Macro, accessible in the USB Mode community space. Recommend upgrading to USB Mode Version 2 when possible.
- Macro 2-2-10: USB Mode Version 2


| Room Device        | Native USB | Macro 1-3 | Macro    2-2-10 | Native USB Inogeni  |
| ------------------ | ---------- | --------- | --------------- | ------------------- |
| C-Series and older | 🟥 **No**     | 🟥 **No**    | 🟥 **No**          | 🟥 **No**              |
| Mx200/300 G1       | 🟥 **No**     | 🟥 **No**    | 🟥 **No**          | 🟥 **No**              |
| Mx200/300 G2       | 🟥 **No**     | 🟥  **No<sup>\*</sup>**  | 🟥 **No**          | 🟥 **No**              |
| Dx70/Dx80          | 🟥 **No**     | 🟥 **No**    | 🟥 **No**          | 🟥 **No**              |
| Sx10               | 🟥 **No**     | 🟥 **No**    | 🟥 **No**          | 🟥 **No**              |
| Sx20               | 🟥 **No**     | 🟥  **No<sup>\*</sup>**  | 🟥 **No**          | 🟥 **No**              |
| Sx80               | 🟥 **No**     | 🟩 **Yes**   | 🟩 **Yes**         | 🟥 **No**              |
| Mx700/700ST        | 🟥 **No**     | 🟩 **Yes**   | 🟩 **Yes**         | 🟥 **No**              |
| Mx800/800ST/800D   | 🟥 **No**     | 🟩 **Yes**   | 🟩 **Yes**         | 🟥 **No**              |
| Board 55/55s       | 🟥 **No**     | 🟥 **No**    | 🟥 **No**          | 🟥 **No**              |
| Board 70/70s       | 🟥 **No**     | 🟥 **No**    | 🟥 **No**          | 🟥 **No**              |
| Board 85s          | 🟥 **No**     | 🟥 **No**    | 🟥 **No**          | 🟥 **No**              |
| Room USB           | 🟩 **Yes**    | 🟥 **No**    | 🟥 **No**          | 🟥 **No**              |
| Room Kit Mini      | 🟩 **Yes**    | 🟥 **No**    | 🟥 **No**          | 🟥 **No**              |
| Room Bar           | 🟩 **Yes**    | 🟥 **No**    | 🟥 **No**          | 🟥 **No**              |
| Room Kit           | 🟥 **No**     | 🟩 **Yes**   | 🟩 **Yes**         | 🟨 **FR (RoS 11)** |
| CODEC Plus         | 🟥 **No**     | 🟩 **Yes**   | 🟩 **Yes**         | 🟨 **FR (RoS 11)** |
| CODEC Pro          | 🟥 **No**     | 🟩 **Yes**   | 🟩 **Yes**         | 🟨 **FR (RoS 11)** |
| Room 55/55D        | 🟥 **No**     | 🟩 **Yes**   | 🟩 **Yes**         | 🟨 **FR (RoS 11)** |
| Room 70D/70S       | 🟥 **No**     | 🟩 **Yes**   | 🟩 **Yes**         | 🟨 **FR (RoS 11)** |
| Room 70D/70S G2    | 🟥 **No**     | 🟩 **Yes**   | 🟩 **Yes**         | 🟨 **FR (RoS 11)** |
| Room 70 Panorama   | 🟥 **No**     | 🟥 **No**    | 🟨 **FR (2.3)**    | 🔲 **In Review<sup>❖</sup>** |
| Room Panorama      | 🟥 **No**     | 🟥 **No**    | 🟨 **FR (2.3)**    | 🔲 **In Review<sup>❖</sup>** |
| Desk Mini          | 🟩 **Yes**    | 🟥 **No**    | 🟥 **No**          | 🟥 **No**              |
| Desk               | 🟩 **Yes**    | 🟥 **No**    | 🟥 **No**          | 🟥 **No**              |
| Desk Hub           | 🟩 **Yes**    | 🟥 **No**    | 🟥 **No**          | 🟥 **No**              |
| Desk Pro           | 🟩 **Yes**    | 🟥 **No**    | 🟥 **No**          | 🟥 **No**              |
| Board Pro 55       | 🟩 **Yes**    | 🟥 **No**    | 🟥 **No**          | 🟥 **No**              |
| Board Pro 75       | 🟩 **Yes**    | 🟥 **No**    | 🟥 **No**          | 🟥 **No**              |


\* => USB mode script will function, but this endpoint requires a 3rd party audio solution to be fed into the USB Capture Device<br />
❖ => Support for this is in review for RoS 11<br />
FR => Future Release, Tentative release version within parenthesis<br />
RoS => Room Os<br />
