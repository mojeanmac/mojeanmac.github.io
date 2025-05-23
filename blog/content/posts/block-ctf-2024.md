+++
date = '2024-11-15T11:20:05-07:00'
draft = false
tags = ['security']
title = 'BlockCTF 2024 writeup'
summary = 'rev writeup from a ctf hosted by square:tm:'
+++

## An Elf on a Shelf | 250 pts | 28 solves
### Challenge

> What's going on here?
>
> [elf.png](https://2024.blockctf.com/files/4be45aef3559f0c0221113248b5feadf/elf.png?token=eyJ1c2VyX2lkIjo0ODEsInRlYW1faWQiOjI4MiwiZmlsZV9pZCI6NDd9.ZzeTDg.IbPkgi5asnzZLkvtK_KwmlC-TVM)
> ![elf.png](/block/elf.png)

### Solution
This is my first hard rev completed successfully with the help of friends!

The pixel encoding looks familiar. The square itself is doubled in resolution, so I have to resample every fourth pixel for further analysis.
```python
from PIL import Image

with Image.open("elf-cropped.png") as img:
    width, height = img.size
    new_img = Image.new("RGB", (width // 2, height // 2))
    # recreate the image only sampling every other pixel
    for x in range(0, width, 2):
        for y in range(0, height, 2):
            new_img.putpixel((x // 2, y // 2), img.getpixel((x, y)))
    new_img.save("elf-crop-small.png")
```
![result](/block/elf-crop-small.png)

I adapted some of [the python](https://replit.com/@molly30/Kitty-Steganography#README.md) I wrote for a [workshop on LSB steganography](https://docs.google.com/presentation/d/1ciClWVrxGWm2nRxe3EIslmAv1vtBA__4nUsYF9Yz1jQ/edit#slide=id.g2cac06ecf6d_0_62) for high schoolers last year to read the full R, G, and B values as bytes and decode them into characters. My first time around, I could definitely parse ascii characters and seemed to resemble `.ELF` format, but the order seemed somewhat scrambled. This program was heavily commented for clarity, since probably less than half of the room knew python. I left the comments in cause why not.
Here's a snippet:
```
wrageimpnglf.ead reageimpngut.inp
```

Because every three characters are reversed, and the fact that the elf is looking in a *mirror* I realized we need to iterate ib reverse across the x-axis.
```python
from PIL import Image
src = "elf-crop-small.png"

binary = []
with Image.open(src) as img:
    width, height = img.size
    for y in range(height):
        for x in reversed(range(width)): # reverse across x
            pixel = list(img.getpixel((x, y)))  # create a 3 element list: [R, G, B]
            for n in range(3):
                # append each byte of R, G, and B, to binary
                binary.append(format(pixel[n], "08b"))

message = ""
for byte in binary: 
    c = chr(int(byte, 2))  # convert byte to a character
    message += c  # add to message
print(message)

# print binary to .elf file
with open("elfy.elf", "wb") as f:
    for byte in binary:
        f.write(bytes([int(byte, 2)]))

```
[Resulting ELF](/block/elfy.elf)

Here's where the actual revving comes in!

To view it, I googled "elf view on mac" and downloaded the release from the first [github page](https://github.com/horsicq/XELFViewer) that came up. This turned out to have a surprise.

![xelf](/block/xelf.png)

The developer is very cracked, but this was a top 10 scary experience.

My friend pointed me to [Cutter](https://cutter.re/), which has a few more useful features. Looking at the recompiler, we saw that there was something being drawn with ImageMagick to the bottom left corner with constant green and blue value.

![decomp](/block/magick.png)

And there it is! The square was in plain sight all along!

![square](/block/square.png)

![square cropped](/block/elf-square.png)

Okay, lets look at just the least significant bit of red and try to remake the flag!
```
QÕhü¥¹hüI ¹IÆÆúÆqq¹õüI ÕQþ
```

Hmm, it also looks like it goes through a function called `mask_flag` before being written to the image

![main](/block/main.png)

![mask](/block/mask.png)

SBOX is likely a lookup table, so the indexes of the bytes I extracted above should correspond to the character values we need!

My friend found it in memory and pasted the raw bytes into discord...

![discord](/block/discord.png)

Okay, I can work with this, just do some string comparison with the bytes while taking care to iterate over every two characters:

```python
from PIL import Image
src = "elf-square.png"

binary = "" 
with Image.open(src) as img:
    width, height = img.size
    for y in range(height):  
        for x in range(width):
            pixel = list(img.getpixel((x, y)))  # create a 3 element list: [R, G, B]
            binary += str(pixel[0] & 1)  # extract only R LSB

message = ""
hexes = []
for i in range(0, len(binary), 8):  # loop through binary list in steps of 8
    byte = binary[i:i + 8]  # get the next 8 bits
    c = chr(int(byte, 2))  # convert byte to a character
    message += c  # add to message
    hexbyte = hex(int(byte, 2))
    hexes.append(hexbyte[2:].zfill(2)) # convert hex byte to two character string

print(message)

sbox = "AE27B18D 7719A46F B04891F8 1669EEF6 30D2DAAA 2E885D63 39CF17E1 B5E23C1A AC3E078E CD763F38 B67EF0C7 97AD8252 FADCDE86 F529587C FB5A35F4 2DE98B0B 12C4838A B8D60C1C 4EE32154 2CCA9A70 BB06ABE7 595EFDFF 558F0EE4 C5348C71 CE687209 4C0151FC 6C494B1B D5B97F4D 850FC6DB 1DAF9564 90570AA5 04FE50BC 107B759C A07DDDE8 1FC83178 81D960CC ED5323B2 5F9B9D94 14057AC1 5B80DF26 28A1EFB4 99252A4A 983A8903 47C26BC3 5CA702F1 D740F9D0 2FC036D4 45736AB3 61D14167 6E209642 22371556 BA441846 CB1E33D8 A60092EB 3D242B62 EC13E584 E0659FE6 F3F2B74F 93BFF7D3 EA6D8732 66080DC9 A243A879 74BD11BE A99E3BA3"
sbox = sbox.replace(" ", "").lower()
lut = [sbox[i:i+2] for i in range(0, len(sbox), 2)] # remake lookup table

for h in hexes:
    if h in lut:
        print(chr(lut.index(h)), end="")
```

And we get the flag! `flag{magick_mirr0r__m4gick_elf}`