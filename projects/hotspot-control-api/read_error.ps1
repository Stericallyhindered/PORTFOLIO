Add-Type @"
using System;
using System.Text;
using System.Runtime.InteropServices;
public class WinFind {
    public delegate bool EnumProc(IntPtr hWnd, IntPtr lParam);
    [DllImport("user32.dll")] public static extern bool EnumWindows(EnumProc lpEnumFunc, IntPtr lParam);
    [DllImport("user32.dll")] public static extern bool EnumChildWindows(IntPtr hWndParent, EnumProc lpEnumFunc, IntPtr lParam);
    [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);
    [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hWnd);
}
"@

$lines = New-Object System.Collections.Generic.List[string]
$callback = [WinFind+EnumProc]{
    param($hWnd, $lParam)
    if (-not [WinFind]::IsWindowVisible($hWnd)) { return $true }
    $text = New-Object System.Text.StringBuilder 512
    [void][WinFind]::GetWindowText($hWnd, $text, 512)
    if ($text.ToString() -eq "PdaNet error") {
        $child = [WinFind+EnumProc]{
            param($ch, $lp)
            $ct = New-Object System.Text.StringBuilder 1024
            [void][WinFind]::GetWindowText($ch, $ct, 1024)
            if ($ct.Length -gt 0) { $script:lines.Add($ct.ToString()) }
            return $true
        }
        [void][WinFind]::EnumChildWindows($hWnd, $child, [IntPtr]::Zero)
    }
    return $true
}
[void][WinFind]::EnumWindows($callback, [IntPtr]::Zero)
$lines | ForEach-Object { Write-Output $_ }
