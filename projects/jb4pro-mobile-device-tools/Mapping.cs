// Mapping.cs
// This console application prints a complete mapping of every byte (or message identifier)
// that the JB4 device returns when sending the "retrieve all settings" command.
// The mapping is based on the parsing logic found in the Form1.cs file's parse_data method.
// Each single‐byte message identifier is listed with its corresponding setting and any conversion notes.
// Additionally, the extended message with identifier 'a' (which is followed by 48 bytes)
// is broken down by byte offsets and its corresponding setting.

using System;
using System.Collections.Generic;

namespace JB4SettingsMapping
{
    class Program
    {
        static void Main(string[] args)
        {
            // Mapping for single-character message identifiers:
            // The key is the identifier (as a string) and the value is the description
            // of the setting that is returned, including any conversion factor or special note.
            Dictionary<string, string> mapping = new Dictionary<string, string>
            {
                { "A", "RPM (engine speed) as plain text" },
                { "B", "Boost (value divided by 10)" },
                { "j", "Boost2 (value divided by 10)" },
                { "C", "TPS (Throttle Position Sensor) value" },
                { "F", "Current Map (map_select_ss); if changed, update current map" },
                { "G", "IAT (Intake Air Temperature)" },
                { "<", "Water Flow" },
                { ">", "Oil Flow" },
                { "f", "E85 Fuel Input value" },
                { "e", "Trans Fuel value converted: (value * 1.8) - 40" },
                { "H", "Clock: Difference from last reading (updates engine clock)" },
                { "D", "PWM (Pulse Width Modulation); multiplied by 0.3921568 to convert" },
                { "E", "Fuel reading" },
                { "&", "EGT (Exhaust Gas Temperature), divided by 1" },
                { "k", "Trims2 (value divided by 1)" },
                { "!", "Gear" },
                { "l", "Speed; value divided by 1.61 to convert (km/h to mph)" },
                { "^", "AFR (Air-Fuel Ratio)" },
                { "%", "Methanol (Meth) value" },
                { "$", "Oil Temperature" },
                { "-", "FFPID (Fuel/FI PID) calculated as (value/2.55)" },
                { ":", "AFR2; value divided by 10" },
                { "Y", "Boot-loader error indicator (firmware upload required)" },
                { "L", "Ambient Voltage; if value >=10, convert (value/1023 * 5)" },
                { "M", "DME Boost value (divided by 10)" },
                { ")", "Ignition Advance (IgnAdv); if >500 set to 50.0, else divided by 10" },
                { "(", "Average Ignition (AvgIgn); if >500 set to 50.0, else divided by 10" },
                { "z", "Average Ignition Drop (AvgIgnDrop); if >500 set to 50.0, else divided by 10" },
                { "*", "DME Boost Target (DMEBT) divided by 10" },
                { "N", "DME Target; value divided by 10" },
                { "Z", "VIN (Vehicle Identification Number) as text" },
                // Extended message 'a' is handled separately.
                { "n", "Future Use A" },
                { "p", "M1 PID Gain" },
                { "r", "M1 Throttle" },
                { "s", "M1 Lag Fix" },
                { "t", "M1 Boost Limit; value divided by 10" },
                { "u", "Feed Forward value" },
                { "v", "Boost Limit 1st (raw value)" },
                { "x", "Boost Limit 2nd (raw value)" },
                { "w", "M1 Meth Hard" },
                { "@", "Methanol Range (MethRange)" },
                { "m", "Methanol Trigger (MethTrigger)" },
                { "o", "FUD Bits – 8-bit value used to set various fuel-related options (updates FUD checkboxes)" },
                { "X", "Fuel Pressure" },
                { "q", "JB4 Firmware version; also parses Platform (before '/') and Board Type (after '//')" },
                { "P", "N1 Min PSI (formatted value)" },
                { "Q", "N1 Enabled flag" },
                { "R", "E85 Setup Bits as an 8-bit value; each bit corresponds to a specific option" },
                { "S", "N1 Min RPM" },
                { "T", "N1 Max RPM" },
                { "U", "N1 Ramp Rate" },
                { "V", "Virtual FF Offset" },
                { "+", "Open Loop value" },
                { "`", "Methanol Safety (MethSafety)" },
                { "=", "CPS (Crankshaft Position Sensor) divided by 10" },
                { "#", "Last Safety value" },
                { "W", "Acceleration" },
                { "{", "N1 Min Gear" },
                { "}", "N1 Min AFR" },
                { "|", "N1 Min Advance" },
                { "~", "KR1 (Knock Retard 1); value divided by 10" },
                { "I", "KR2; value divided by 10" },
                { "J", "KR3; value divided by 10" },
                { "O", "KR4; value divided by 10" },
                { "K", "KR5; value divided by 10" },
                { "y", "KR6; value divided by 10" },
                { "[", "KR7; value divided by 10" },
                { "\\", "KR8; value divided by 10" },
                { "]", "Auxiliary 1" },
                { "_", "Auxiliary 2" },
                { "b", "Auxiliary 3" },
                { "c", "Auxiliary 4" },
                { "d", "Auxiliary 5" },
                { "g", "Auxiliary 6" },
                { "h", "MAF1 (Mass Air Flow Sensor 1)" },
                { "i", "MAF2 (Mass Air Flow Sensor 2)" }
            };

            // Mapping for the extended message with identifier 'a'
            // When the identifier 'a' is received, the next 48 bytes are parsed as follows:
            // Bytes are grouped into words where specified, and certain single-byte values follow.
            // Offsets are relative to the start of the message immediately after the identifier.
            List<(int Offset, string Setting, string Note)> extendedMapping = new List<(int, string, string)>
            {
                (1,  "RPM1500",    "2 bytes combined; value divided by 10"),
                (3,  "RPM2000",    "2 bytes combined; value divided by 10"),
                (5,  "RPM2500",    "2 bytes combined; value divided by 10"),
                (7,  "RPM3000",    "2 bytes combined; value divided by 10"),
                (9,  "RPM3500",    "2 bytes combined; value divided by 10"),
                (11, "RPM4000",    "2 bytes combined; value divided by 10"),
                (13, "RPM4500",    "2 bytes combined; value divided by 10"),
                (15, "RPM5000",    "2 bytes combined; value divided by 10"),
                (17, "RPM5500",    "2 bytes combined; value divided by 10"),
                (19, "RPM6000",    "2 bytes combined; value divided by 10"),
                (21, "RPM6500",    "2 bytes combined; value divided by 10"),
                (23, "RPM7000",    "2 bytes combined; value divided by 10"),
                (25, "TMAP Sensor", "Single byte value"),
                (26, "Boost Limit 3rd", "Single byte; round to 1 decimal place as needed"),
                (27, "Fuel 2500",    "Single byte value"),
                (28, "Fuel 3000",    "Single byte value"),
                (29, "Fuel 3500",    "Single byte value"),
                (30, "Fuel 4000",    "Single byte value"),
                (31, "Fuel 4500",    "Single byte value"),
                (32, "Fuel 5000",    "Single byte value"),
                (33, "Fuel 5500",    "Single byte value"),
                (34, "Fuel 6000",    "Single byte value"),
                (35, "Fuel 6500",    "Single byte value"),
                (36, "Six Cyl Timing", "Single byte value"),
                (37, "CPS1500",     "Single byte value"),
                (38, "CPS2000",     "Single byte value"),
                (39, "CPS2500",     "Single byte value"),
                (40, "CPS3000",     "Single byte value"),
                (41, "CPS3500",     "Single byte value"),
                (42, "CPS4000",     "Single byte value"),
                (43, "CPS4500",     "Single byte value"),
                (44, "CPS5000",     "Single byte value"),
                (45, "CPS5500",     "Single byte value"),
                (46, "CPS6000",     "Single byte value"),
                (47, "CPS6500",     "Single byte value"),
                (48, "CPS7000",     "Single byte value")
            };

            Console.WriteLine("JB4 Device Settings Byte Assignments");
            Console.WriteLine("=====================================");
            Console.WriteLine("\nSingle-Byte Message Identifiers:");
            foreach (var kvp in mapping)
            {
                Console.WriteLine($"Identifier '{kvp.Key}': {kvp.Value}");
            }

            Console.WriteLine("\nExtended Message 'a' (48 bytes following the identifier):");
            Console.WriteLine("Offsets are relative to the first byte AFTER the 'a' identifier.");
            foreach (var item in extendedMapping)
            {
                Console.WriteLine($"Offset {item.Offset}: {item.Setting} – {item.Note}");
            }

            Console.WriteLine("\nPress any key to exit...");
            Console.ReadKey();
        }
    }
}
