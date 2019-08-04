# ImageHiddenMessage

## Protocol
### Note:
To evaluate a pixel's value the pixel's 3 channels are taken and the values taken module 3. This gives us 3³ states. All states but 111 are taken and hence a pixel describes the same data as a byte.

| Name | Offset (in px) | Length (in px) | Data |
| ---  | ---    | ---    |   ---|
|Entry Indicator | 0 | 20 | Defines the entry point for reading data (X) as an offset.
| Entry | X | 20 | This data needs to be identical to the entry indicator. If this is the case, we can assume a message is hidden.
| Length Indicator | X+20 | 16| Sets the length of the message (L) **as characters**. One char equals 2 pixels. If this is longer than the image then we can assume an error.
|Message begin|X+36|2L|The message in consecutive order.|
|Message end | X+36+2L| - | End of message. There is no particular indicator for the end of the message as this in defined in the Length Indicator.