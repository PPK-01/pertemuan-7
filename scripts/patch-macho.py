#!/usr/bin/env python3
"""
patch-macho.py
Modifies Mach-O binaries built for iOS Simulator (platform 7) to target physical iOS (platform 2).
This enables dyld on physical iOS devices to load the binary in container environments (LiveContainer).
Works on both FAT (universal) and THIN Mach-O binaries across macOS and Linux.
"""

import sys
import struct
import os

PLATFORM_IOS = 2
PLATFORM_IOSSIMULATOR = 7
LC_BUILD_VERSION = 0x32

def patch_slice(data, offset, size):
    slice_magic = struct.unpack('<I', data[offset:offset+4])[0]
    if slice_magic not in (0xfeedfacf, 0xfeedface):
        return False
    is_64 = slice_magic == 0xfeedfacf
    hdr_size = 32 if is_64 else 28
    cputype, cpusubtype, filetype, ncmds, sizeofcmds, flags = struct.unpack('<IIIIII', data[offset+4:offset+hdr_size-4])
    cmd_offset = offset + hdr_size
    patched = False
    for _ in range(ncmds):
        cmd, cmdsize = struct.unpack('<II', data[cmd_offset:cmd_offset+8])
        if cmd == LC_BUILD_VERSION:
            platform = struct.unpack('<I', data[cmd_offset+8:cmd_offset+12])[0]
            if platform == PLATFORM_IOSSIMULATOR:
                struct.pack_into('<I', data, cmd_offset+8, PLATFORM_IOS)
                patched = True
        cmd_offset += cmdsize
    return patched

def patch_binary(file_path):
    with open(file_path, 'r+b') as f:
        data = bytearray(f.read())
        if len(data) < 8:
            return False

        magic = struct.unpack('>I', data[:4])[0]
        patched = False

        if magic == 0xcafebabe: # FAT_MAGIC
            nfat = struct.unpack('>I', data[4:8])[0]
            for i in range(nfat):
                cputype, cpusubtype, offset, size, align = struct.unpack('>IIIII', data[8+i*20:8+(i+1)*20])
                if patch_slice(data, offset, size):
                    patched = True
        elif magic in (0xfeedfacf, 0xfeedface) or struct.unpack('<I', data[:4])[0] in (0xfeedfacf, 0xfeedface):
            if patch_slice(data, 0, len(data)):
                patched = True

        if patched:
            f.seek(0)
            f.write(data)
            f.truncate()
            return True
        return False

def main():
    if len(sys.argv) < 2:
        print("Usage: patch-macho.py <binary-file>")
        sys.exit(1)

    file_path = sys.argv[1]
    if not os.path.isfile(file_path):
        print(f"File not found: {file_path}")
        sys.exit(1)

    success = patch_binary(file_path)
    if success:
        print(f"✓ Patched Mach-O platform (iOS-simulator -> iOS) in: {file_path}")
    else:
        print(f"ℹ No iOS-simulator platform tag needed patching in: {file_path}")

if __name__ == '__main__':
    main()
