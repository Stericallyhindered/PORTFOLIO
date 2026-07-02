
outgoing numbers are converted to byte values (using routines like WordToBytes) 
although they appear as decimal numbers, they are sent as their corresponding ASCII codes. 
The “a” response (48 bytes) is treated as an extended sensor packet and is simply skipped over by the parser. 
Timing between each byte sent is handled via a delay (msDELAY2) to prevent buffer overruns. 
Firmware update commands (ZY, U, V, YX) and configuration commands (R for settings save, T for N2O/E85) are all included.



====================================================================================================================
                           OUTGOING COMMANDS (APP → JB4)
====================================================================================================================
| Command           | Byte Array Example       | Format/Packet Details                                                                                          | Description / Expected Action
--------------------------------------------------------------------------------------------------------------------
| BBB               | [0x42, 0x42, 0x42]       | ASCII "BBB": 0x42 0x42 0x42                                                                                    | Stops any ongoing data stream / handshake initiation.
| E                 | [0x45]                   | ASCII "E": 0x45                                                                                                | Part of the handshake; typically sent twice to verify communication.
| $#CJ              | [0x24, 0x23, 0x43, 0x4A]   | ASCII "$#CJ": 0x24 0x23 0x43 0x4A                                                                            | Requests tuning/configuration data from JB4.
| A                 | [0x41]                   | ASCII "A": 0x41                                                                                                | Request RPM reading; JB4 responds with an "A" message containing RPM.
| CA                | [0x43, 0x41]             | ASCII "CA": 0x43 0x41                                                                                          | Starts logging/data capture. Clears buffers & begins continuous streaming.
| B                 | [0x42]                   | ASCII "B": 0x42                                                                                                | Stops logging; halts data transmission.
| !, #, [, J        | [0x21, 0x23, 0x5B, 0x4A]   | ASCII "!", "#", "[", "J": 0x21 0x23 0x5B 0x4A (sent sequentially with delays)                                | Used in the pause routine to stop logging and clear buffers.
| M + value         | [0x4D, ...]              | Begins with ASCII "M": 0x4D, then ASCII digits representing the value (e.g. "M123" = 0x4D 0x31 0x32 0x33)      | Changes active map selection; triggers a settings update. (Variable length)
| R (Settings Save) | [0x52, s1,..., s61, chk, 0x23] | 64-byte packet: Byte0 = ASCII "R": 0x52; Bytes 1–61 = settings data 
								(each field converted via WordToBytes, shown in hex);  | Saves settings; JB4 then sends a 48-byte "a" packet as acknowledgment.
|                   |                          | Byte62 = checksum (sum of bytes 1–61 mod 256, in hex); Byte63 = ASCII "#": 0x23                                |
| T (N2O/E85 Config) | [0x54, cfg1, cfg2, …, cfgN] | Starts with ASCII "T": 0x54, followed by configuration bytes (each shown in hex)                           | Configures N2O/E85 parameters. No explicit reply is parsed.
| ZY                | [0x5A, 0x59]             | ASCII "ZY": 0x5A 0x59                                                                                          | Puts JB4 into bootloader mode (for firmware update).
| U                 | [0x55]                   | ASCII "U": 0x55                                                                                                | Initiates flash erase for firmware update; JB4 replies with 0x55 (OK) or 0x58 (failure).
| V                 | [0x56]                   | ASCII "V": 0x56                                                                                                | Writes a 64-byte flash block (sent repeatedly during firmware update); a reply byte is expected.
| YX                | [0x59, 0x58]             | ASCII "YX": 0x59 0x58                                                                                          | Reboots JB4 after firmware update.
====================================================================================================================


====================================================================================================================
                           INCOMING RESPONSES (JB4 → APP)
====================================================================================================================
| Response     | Received As            | Format/Packet Details                                                                                           | Description / Conversion Details
--------------------------------------------------------------------------------------------------------------------
| A            | [0x41, ...]            | ASCII "A": 0x41 followed by ASCII digits (e.g. "7000" = 0x37 0x30 0x30 0x37)                                  | RPM reading.
| B            | [0x42, ...]            | ASCII "B": 0x42 followed by a numeric string (e.g., "2.0" = 0x32 0x2E 0x30)                                     | Primary boost reading.
| j            | [0x6A, ...]            | ASCII "j": 0x6A followed by numeric string                                                                      | Secondary boost (boost2) reading.
| C            | [0x43, ...]            | ASCII "C": 0x43 followed by numeric string                                                                      | Throttle Position Sensor (TPS) reading.
| F            | [0x46, ...]            | ASCII "F": 0x46 followed by a string (e.g., "Pick")                                                              | Current map indicator; may update UI status.
| G            | [0x47, ...]            | ASCII "G": 0x47 followed by numeric string                                                                      | Intake Air Temperature (IAT) reading.
| <            | [0x3C, ...]            | ASCII "<": 0x3C followed by numeric string                                                                      | Water fuel sensor reading.
| >            | [0x3E, ...]            | ASCII ">": 0x3E followed by numeric string                                                                      | Oil fuel sensor reading.
| f            | [0x66, ...]            | ASCII "f": 0x66 followed by numeric string                                                                      | E85 sensor reading.
| e            | [0x65, ...]            | ASCII "e": 0x65 followed by numeric string (processed as (raw × 1.8) – 40)                                         | Transmission temperature reading.
| H            | [0x48, ...]            | ASCII "H": 0x48 followed by numeric string (delta computed from previous clock value)                             | Clock/time delta reading.
| D            | [0x44, ...]            | ASCII "D": 0x44 followed by numeric string (multiplied by 0.3921568)                                              | PWM reading.
| E            | [0x45, ...]            | ASCII "E": 0x45 followed by numeric string                                                                      | Fuel sensor reading.
| &            | [0x26, ...]            | ASCII "&": 0x26 followed by numeric string                                                                      | Exhaust Gas Temperature (EGT) reading.
| k            | [0x6B, ...]            | ASCII "k": 0x6B followed by numeric string                                                                      | Secondary trim (trims2) reading.
| !            | [0x21, ...]            | ASCII "!": 0x21 followed by numeric string                                                                      | Gear reading.
| l            | [0x6C, ...]            | ASCII "l": 0x6C followed by numeric string (converted from km/h to mph)                                           | Speed reading.
| ^            | [0x5E, ...]            | ASCII "^": 0x5E followed by numeric string                                                                      | Air Fuel Ratio (AFR) reading.
| %            | [0x25, ...]            | ASCII "%": 0x25 followed by numeric string                                                                      | Methanol injection reading.
| $            | [0x24, ...]            | ASCII "$": 0x24 followed by numeric string                                                                      | Oil temperature reading.
| -            | [0x2D, ...]            | ASCII "-": 0x2D followed by numeric string (divided by 2.55)                                                     | FFpid reading.
| :            | [0x3A, ...]            | ASCII ":" (0x3A) followed by numeric string (divided by 10)                                                      | Secondary AFR reading.
| Y            | [0x59, ...]            | ASCII "Y": 0x59 (optionally followed by error digits)                                                            | Bootloader error indication (firmware not loaded).
| L            | [0x4C, ...]            | ASCII "L": 0x4C followed by numeric string (if value > 10, processed as (raw/1023 × 5))                           | Ambient voltage reading.
| M            | [0x4D, ...]            | ASCII "M": 0x4D followed by numeric string (divided by 10)                                                       | DMEboost reading.
| )            | [0x29, ...]            | ASCII ")": 0x29 followed by numeric string (divided by 10, capped at 50)                                           | Ignition advance reading.
| (            | [0x28, ...]            | ASCII "(" (0x28) followed by numeric string (divided by 10, capped at 50)                                          | Average ignition reading.
| z            | [0x7A, ...]            | ASCII "z": 0x7A followed by numeric string (divided by 10, capped at 50)                                           | Average ignition drop reading.
| *            | [0x2A, ...]            | ASCII "*": 0x2A followed by numeric string (divided by 10)                                                       | DMEbt reading.
| N            | [0x4E, ...]            | ASCII "N": 0x4E followed by numeric string (divided by 10)                                                       | DME target reading.
| Z            | [0x5A, ...]            | ASCII "Z": 0x5A followed by a 12-character string                                                                | VIN (vehicle identification number).
| a            | [0x61, 48 bytes]         | Fixed 48-byte packet: starts with ASCII "a": 0x61, then 48 raw data bytes                                          | Extended sensor data packet (includes RPM thresholds, fuel limits, TMAP, CPS, etc.)
| n            | [0x6E, ...]            | ASCII "n": 0x6E followed by numeric string                                                                      | Reserved / future use.
| p            | [0x70, ...]            | ASCII "p": 0x70 followed by numeric string                                                                      | M1pidgain reading.
| r            | [0x72, ...]            | ASCII "r": 0x72 followed by numeric string                                                                      | M1throttle reading.
| s            | [0x73, ...]            | ASCII "s": 0x73 followed by numeric string                                                                      | M1lagfix reading.
| t            | [0x74, ...]            | ASCII "t": 0x74 followed by numeric string (divided by 10)                                                       | M1boostlimit reading.
| u            | [0x75, ...]            | ASCII "u": 0x75 followed by numeric string                                                                      | Feed forward reading.
| v            | [0x76, ...]            | ASCII "v": 0x76 followed by numeric string                                                                      | Boost limit 1st reading.
| x            | [0x78, ...]            | ASCII "x": 0x78 followed by numeric string                                                                      | Boost limit 2nd reading.
| w            | [0x77, ...]            | ASCII "w": 0x77 followed by numeric string                                                                      | M1methhard reading.
| @            | [0x40, ...]            | ASCII "@": 0x40 followed by numeric string                                                                      | Methrange reading.
| m            | [0x6D, ...]            | ASCII "m": 0x6D followed by numeric string                                                                      | Meth trigger reading.
| o            | [0x6F]                 | Single byte: 0x6F (each bit represents a Flex Fuel Setup flag)                                                   | Flex Fuel (FUD) configuration (bits parsed into individual options).
| X            | [0x58, ...]            | ASCII "X": 0x58 followed by numeric string                                                                      | Fuel pressure sensor reading.
| q            | [0x71, ...]            | ASCII "q": 0x71 followed by a string in the format "xx/yy//zz" (e.g., "10/20//5")                                  | Firmware version and board type report.
| P            | [0x50, ...]            | ASCII "P": 0x50 followed by numeric string                                                                      | N1minpsi reading.
| Q            | [0x51, ...]            | ASCII "Q": 0x51 followed by numeric string                                                                      | N1enabled flag/status.
| R (response)  | [0x52]                 | Single byte: 0x52 (each bit represents an E85 configuration option)                                             | E85 configuration bits.
| S            | [0x53, ...]            | ASCII "S": 0x53 followed by numeric string                                                                      | N1minrpm reading.
| T (response)  | [0x54, ...]            | ASCII "T": 0x54 followed by numeric string                                                                      | N1maxrpm reading.
| U (response)  | [0x55, ...]            | ASCII "U": 0x55 followed by numeric string                                                                      | N1ramprate reading.
| V (response)  | [0x56, ...]            | ASCII "V": 0x56 followed by numeric string                                                                      | Virtual Fuel Flow (FF) offset reading.
| +            | [0x2B, ...]            | ASCII "+": 0x2B followed by numeric string                                                                      | Open loop fuel/timing reading.
| `            | [0x60, ...]            | ASCII "`": 0x60 followed by numeric string                                                                      | Meth safety setting.
| =            | [0x3D, ...]            | ASCII "=": 0x3D followed by numeric string (divided by 10)                                                      | CPS (Cycles Per Second) reading.
| #            | [0x23, ...]            | ASCII "#": 0x23 followed by numeric string                                                                      | Last safety reading.
| W            | [0x57, ...]            | ASCII "W": 0x57 followed by numeric string                                                                      | Acceleration sensor reading.
| {            | [0x7B, ...]            | ASCII "{": 0x7B followed by numeric string                                                                      | N1mingear reading.
| }            | [0x7D, ...]            | ASCII "}": 0x7D followed by numeric string                                                                      | N1minafr reading.
| |            | [0x7C, ...]            | ASCII "|": 0x7C followed by numeric string                                                                      | N1minadvance reading.
| ~            | [0x7E, ...]            | ASCII "~": 0x7E followed by numeric string (divided by 10)                                                      | KR1 (Knock Retard sensor 1) reading.
| I            | [0x49, ...]            | ASCII "I": 0x49 followed by numeric string (divided by 10)                                                      | KR2 reading.
| J            | [0x4A, ...]            | ASCII "J": 0x4A followed by numeric string (divided by 10)                                                      | KR3 reading.
| O            | [0x4F, ...]            | ASCII "O": 0x4F followed by numeric string (divided by 10)                                                      | KR4 reading.
| K            | [0x4B, ...]            | ASCII "K": 0x4B followed by numeric string (divided by 10)                                                      | KR5 reading.
| y            | [0x79, ...]            | ASCII "y": 0x79 followed by numeric string (divided by 10)                                                      | KR6 reading.
| [            | [0x5B, ...]            | ASCII "[": 0x5B followed by numeric string (divided by 10)                                                      | KR7 reading.
| \            | [0x5C, ...]            | ASCII "\" : 0x5C followed by numeric string (divided by 10)                                                     | KR8 reading.
| ]            | [0x5D, ...]            | ASCII "]": 0x5D followed by numeric string                                                                      | Auxiliary sensor 1 (Aux1) reading.
| _            | [0x5F, ...]            | ASCII "_": 0x5F followed by numeric string                                                                      | Auxiliary sensor 2 (Aux2) reading.
| b            | [0x62, ...]            | ASCII "b": 0x62 followed by numeric string                                                                      | Auxiliary sensor 3 (Aux3) reading.
| c            | [0x63, ...]            | ASCII "c": 0x63 followed by numeric string                                                                      | Auxiliary sensor 4 (Aux4) reading.
| d            | [0x64, ...]            | ASCII "d": 0x64 followed by numeric string                                                                      | Auxiliary sensor 5 (Aux5) reading.
| g            | [0x67, ...]            | ASCII "g": 0x67 followed by numeric string                                                                      | Auxiliary sensor 6 (Aux6) reading.
| h            | [0x68, ...]            | ASCII "h": 0x68 followed by numeric string                                                                      | MAF1 reading.
| i            | [0x69, ...]            | ASCII "i": 0x69 followed by numeric string                                                                      | MAF2 reading.
====================================================================================================================


====================================================================================================================
                           INCOMING RESPONSES (JB4 → APP) PARSING SUMMARY
====================================================================================================================
| Response | Format/Packet Details                                            | Description / Conversion Details                                                                                              |
|----------|------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------|
| A        | "A" followed by ASCII numeric digits (e.g., "7000")              | RPM reading – the numeric string is parsed as an integer representing the engine RPM.                                         |
| B        | "B" followed by a numeric string (e.g., "2.0")                     | Primary boost reading – the string is converted to a double, divided by 10, and formatted to 0.0.##.                             |
| j        | "j" followed by a numeric string                                 | Secondary boost (boost2) reading – processed similar to “B” (divided by 10).                                                   |
| C        | "C" followed by a numeric string                                 | Throttle Position Sensor (TPS) reading – displayed as provided.                                                              |
| F        | "F" followed by text (e.g., "Pick")                                | Map selection indicator – updates the current map shown in the UI.                                                           |
| G        | "G" followed by a numeric string                                 | Intake Air Temperature (IAT) reading – parsed as an integer.                                                                  |
| <        | "<" followed by a numeric string                                 | Water fuel sensor reading – value shown as provided.                                                                        |
| >        | ">" followed by a numeric string                                 | Oil fuel sensor reading – value shown as provided.                                                                          |
| f        | "f" followed by a numeric string                                 | E85 sensor reading – the raw numeric string is used directly.                                                               |
| e        | "e" followed by a numeric string                                 | Transmission temperature – computed as: (raw value × 1.8) – 40.                                                               |
| H        | "H" followed by a numeric string                                 | Clock/timing reading – the difference (delta) from the previous clock value is computed and displayed.                        |
| D        | "D" followed by a numeric string                                 | PWM reading – the numeric string is converted, multiplied by 0.3921568, and then cast to an integer.                          |
| E        | "E" followed by a numeric string                                 | Fuel sensor reading – directly displayed as provided.                                                                       |
| &        | "&" followed by a numeric string                                 | Exhaust Gas Temperature (EGT) – the numeric string is divided by 1 and rounded to one decimal place.                         |
| k        | "k" followed by a numeric string                                 | Secondary trim (trims2) reading – displayed after rounding the converted value (typically divided by 1).                        |
| !        | "!" followed by a numeric string                                 | Gear reading – the value is used directly to indicate the current gear.                                                     |
| l        | "l" followed by a numeric string                                 | Speed reading – the value (presumed in km/h) is converted to mph by dividing by 1.61 and then cast to an integer.              |
| ^        | "^" followed by a numeric string                                 | Air/Fuel Ratio (AFR) reading – the raw numeric string is displayed.                                                         |
| %        | "%" followed by a numeric string                                 | Methanol injection reading – displayed as provided.                                                                        |
| $        | "$" followed by a numeric string                                 | Oil temperature reading – the numeric string is parsed and displayed.                                                       |
| -        | "-" followed by a numeric string                                 | FFpid reading – the numeric value is divided by 2.55 and then converted to an integer.                                        |
| :        | ":" followed by a numeric string                                 | Secondary AFR reading – the value is divided by 10 and rounded to one decimal place.                                         |
| Y        | "Y" optionally followed by error digits                          | Bootloader error indicator – if a value (e.g., "2") is received, it signifies that the firmware is not loaded properly.        |
| L        | "L" followed by a numeric string                                 | Ambient voltage reading – if the value is less than 10 it’s taken directly; otherwise, computed as (raw/1023 × 5).             |
| M        | "M" followed by a numeric string                                 | DMEboost reading – the value is divided by 10 and rounded to one decimal.                                                     |
| )        | ")" followed by a numeric string                                 | Ignition advance reading – the value is divided by 10 (with a cap at 50 if above threshold).                                  |
| (        | "(" followed by a numeric string                                 | Average ignition reading – similarly processed (divided by 10, capped at 50).                                                 |
| z        | "z" followed by a numeric string                                 | Average ignition drop reading – processed as above (divided by 10, capped at 50).                                             |
| *        | "*" followed by a numeric string                                 | DMEbt reading – the numeric string is divided by 10 and rounded.                                                             |
| N        | "N" followed by a numeric string                                 | DME target reading – the value is divided by 10 and rounded to one decimal.                                                  |
| Z        | "Z" followed by a 12-character string                              | VIN – the vehicle identification number is displayed as plain text.                                                         |
| a        | "a" followed by 48 raw bytes                                       | Extended sensor packet – see detailed breakdown below.                                                                     |
| n        | "n" followed by a numeric string                                 | Reserved/future use field – currently not utilized.                                                                         |
| p        | "p" followed by a numeric string                                 | M1pidgain reading – parsed as an integer.                                                                                   |
| r        | "r" followed by a numeric string                                 | M1throttle reading – parsed as an integer.                                                                                  |
| s        | "s" followed by a numeric string                                 | M1lagfix reading – parsed as an integer.                                                                                    |
| t        | "t" followed by a numeric string                                 | M1boostlimit reading – the value is divided by 10 and rounded accordingly.                                                  |
| u        | "u" followed by a numeric string                                 | Feed forward reading – parsed as a numeric value.                                                                           |
| v        | "v" followed by a numeric string                                 | Boost limit 1st reading – rounded to one decimal place.                                                                     |
| x        | "x" followed by a numeric string                                 | Boost limit 2nd reading – rounded to one decimal place.                                                                     |
| w        | "w" followed by a numeric string                                 | M1methhard reading – parsed and displayed directly.                                                                         |
| @        | "@" followed by a numeric string                                 | Methrange reading – parsed as a numeric value.                                                                              |
| m        | "m" followed by a numeric string                                 | Meth trigger reading – parsed as an integer.                                                                                |
| o        | "o" (single byte)                                                  | Flex Fuel (FUD) configuration – each bit in the byte represents a specific option; these bits are parsed into individual flags.|
| X        | "X" followed by a numeric string                                 | Fuel pressure sensor reading – parsed and displayed as provided.                                                            |
| q        | "q" followed by a string in the format "xx/yy//zz"                 | Firmware version and board type – the string is parsed to update internal variables (platform and board_type).                |
| P        | "P" followed by a numeric string                                 | N1minpsi reading – parsed as an integer or decimal value.                                                                   |
| Q        | "Q" followed by a numeric string                                 | N1enabled flag/status – displayed as provided.                                                                              |
| R        | "R" as a single byte                                               | E85 configuration bits – each bit represents an E85 option; converted into individual settings flags.                       |
| S        | "S" followed by a numeric string                                 | N1minrpm reading – parsed as an integer.                                                                                    |
| T        | "T" followed by a numeric string                                 | N1maxrpm reading – parsed as an integer.                                                                                    |
| U        | "U" followed by a numeric string                                 | N1ramprate reading – parsed and displayed directly.                                                                         |
| V        | "V" followed by a numeric string                                 | Virtual Fuel Flow (FF) offset reading – parsed as a numeric value.                                                          |
| +        | "+" followed by a numeric string                                 | Open loop fuel/timing reading – parsed and displayed directly.                                                              |
| `        | "`" followed by a numeric string                                 | Meth safety setting – parsed as a numeric value.                                                                            |
| =        | "=" followed by a numeric string                                 | CPS reading – the value is divided by 10 and rounded to one decimal place.                                                  |
| #        | "#" followed by a numeric string                                 | Last safety reading – parsed as an integer.                                                                                 |
| W        | "W" followed by a numeric string                                 | Acceleration sensor reading – parsed and displayed directly.                                                                |
| {        | "{" followed by a numeric string                                 | N1mingear reading – parsed as an integer.                                                                                   |
| }        | "}" followed by a numeric string                                 | N1minafr reading – parsed as an integer.                                                                                    |
| |        | "|" followed by a numeric string                                 | N1minadvance reading – parsed as an integer.                                                                                |
| ~        | "~" followed by a numeric string                                 | KR1 reading – value divided by 10 and rounded to one decimal place.                                                         |
| I        | "I" followed by a numeric string                                 | KR2 reading – value divided by 10 and rounded.                                                                              |
| J        | "J" followed by a numeric string                                 | KR3 reading – value divided by 10 and rounded.                                                                              |
| O        | "O" followed by a numeric string                                 | KR4 reading – value divided by 10 and rounded.                                                                              |
| K        | "K" followed by a numeric string                                 | KR5 reading – value divided by 10 and rounded.                                                                              |
| y        | "y" followed by a numeric string                                 | KR6 reading – value divided by 10 and rounded.                                                                              |
| [        | "[" followed by a numeric string                                 | KR7 reading – value divided by 10 and rounded.                                                                              |
| \        | "\" followed by a numeric string                                 | KR8 reading – value divided by 10 and rounded.                                                                              |
| ]        | "]" followed by a numeric string                                 | Auxiliary sensor 1 (Aux1) reading – parsed as an integer.                                                                   |
| _        | "_" followed by a numeric string                                 | Auxiliary sensor 2 (Aux2) reading – parsed as an integer.                                                                   |
| b        | "b" followed by a numeric string                                 | Auxiliary sensor 3 (Aux3) reading – parsed as an integer.                                                                   |
| c        | "c" followed by a numeric string                                 | Auxiliary sensor 4 (Aux4) reading – parsed as an integer.                                                                   |
| d        | "d" followed by a numeric string                                 | Auxiliary sensor 5 (Aux5) reading – parsed as an integer.                                                                   |
| g        | "g" followed by a numeric string                                 | Auxiliary sensor 6 (Aux6) reading – parsed as an integer.                                                                   |
| h        | "h" followed by a numeric string                                 | MAF1 reading – parsed as an integer.                                                                                        |
| i        | "i" followed by a numeric string                                 | MAF2 reading – parsed as an integer.                                                                                        |
====================================================================================================================


=================== Detailed Breakdown of Extended Sensor Packet ("a") ===================
The "a" response begins with the letter "a" and is followed by 48 bytes of raw data.
Each field is extracted as follows (byte indices are relative to the first byte after the "a" identifier):

| Byte Range  | Field                | Calculation/Conversion                           | Description                                                       |
|-------------|----------------------|--------------------------------------------------|-------------------------------------------------------------------|
| Bytes 1-2   | RPM 1500             | (byte1 × 256 + byte2) / 10                         | Calibration RPM value for 1500 RPM.                               |
| Bytes 3-4   | RPM 2000             | (byte3 × 256 + byte4) / 10                         | Calibration RPM value for 2000 RPM.                               |
| Bytes 5-6   | RPM 2500             | (byte5 × 256 + byte6) / 10                         | Calibration RPM value for 2500 RPM.                               |
| Bytes 7-8   | RPM 3000             | (byte7 × 256 + byte8) / 10                         | Calibration RPM value for 3000 RPM.                               |
| Bytes 9-10  | RPM 3500             | (byte9 × 256 + byte10) / 10                        | Calibration RPM value for 3500 RPM.                               |
| Bytes 11-12 | RPM 4000             | (byte11 × 256 + byte12) / 10                       | Calibration RPM value for 4000 RPM.                               |
| Bytes 13-14 | RPM 4500             | (byte13 × 256 + byte14) / 10                       | Calibration RPM value for 4500 RPM.                               |
| Bytes 15-16 | RPM 5000             | (byte15 × 256 + byte16) / 10                       | Calibration RPM value for 5000 RPM.                               |
| Bytes 17-18 | RPM 5500             | (byte17 × 256 + byte18) / 10                       | Calibration RPM value for 5500 RPM.                               |
| Bytes 19-20 | RPM 6000             | (byte19 × 256 + byte20) / 10                       | Calibration RPM value for 6000 RPM.                               |
| Bytes 21-22 | RPM 6500             | (byte21 × 256 + byte22) / 10                       | Calibration RPM value for 6500 RPM.                               |
| Bytes 23-24 | RPM 7000             | (byte23 × 256 + byte24) / 10                       | Calibration RPM value for 7000 RPM.                               |
| Byte 25     | TMAP Sensor          | Direct byte value                                | Raw reading from the TMAP sensor.                                 |
| Byte 26     | Boost Limit 3rd      | Direct byte value (formatted to 1 decimal)       | Third boost limit setting.                                        |
| Byte 27     | Fuel at 2500 RPM     | Direct byte value                                | Fuel setting for 2500 RPM.                                          |
| Byte 28     | Fuel at 3000 RPM     | Direct byte value                                | Fuel setting for 3000 RPM.                                          |
| Byte 29     | Fuel at 3500 RPM     | Direct byte value                                | Fuel setting for 3500 RPM.                                          |
| Byte 30     | Fuel at 4000 RPM     | Direct byte value                                | Fuel setting for 4000 RPM.                                          |
| Byte 31     | Fuel at 4500 RPM     | Direct byte value                                | Fuel setting for 4500 RPM.                                          |
| Byte 32     | Fuel at 5000 RPM     | Direct byte value                                | Fuel setting for 5000 RPM.                                          |
| Byte 33     | Fuel at 5500 RPM     | Direct byte value                                | Fuel setting for 5500 RPM.                                          |
| Byte 34     | Fuel at 6000 RPM     | Direct byte value                                | Fuel setting for 6000 RPM.                                          |
| Byte 35     | Fuel at 6500 RPM     | Direct byte value                                | Fuel setting for 6500 RPM.                                          |
| Byte 36     | Six-Cylinder Timing  | Direct byte value                                | Timing value for six-cylinder operation.                          |
| Byte 37     | CPS at 1500 RPM      | Direct byte value                                | Cycles per second at 1500 RPM.                                      |
| Byte 38     | CPS at 2000 RPM      | Direct byte value                                | CPS at 2000 RPM.                                                    |
| Byte 39     | CPS at 2500 RPM      | Direct byte value                                | CPS at 2500 RPM.                                                    |
| Byte 40     | CPS at 3000 RPM      | Direct byte value                                | CPS at 3000 RPM.                                                    |
| Byte 41     | CPS at 3500 RPM      | Direct byte value                                | CPS at 3500 RPM.                                                    |
| Byte 42     | CPS at 4000 RPM      | Direct byte value                                | CPS at 4000 RPM.                                                    |
| Byte 43     | CPS at 4500 RPM      | Direct byte value                                | CPS at 4500 RPM.                                                    |
| Byte 44     | CPS at 5000 RPM      | Direct byte value                                | CPS at 5000 RPM.                                                    |
| Byte 45     | CPS at 5500 RPM      | Direct byte value                                | CPS at 5500 RPM.                                                    |
| Byte 46     | CPS at 6000 RPM      | Direct byte value                                | CPS at 6000 RPM.                                                    |
| Byte 47     | CPS at 6500 RPM      | Direct byte value                                | CPS at 6500 RPM.                                                    |
| Byte 48     | CPS at 7000 RPM      | Direct byte value                                | CPS at 7000 RPM.                                                    |
====================================================================================================================

This chart details every response (by command letter) that the JB4 parser handles—from simple ASCII numeric responses to the complex 48‑byte extended sensor packet.

====================================================================================================================
