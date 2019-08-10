# ImageHiddenMessage

## Protocol
### Note:
To evaluate a pixel's value the pixel's 3 channels are taken and the values taken modulo 2. This gives us 2³ states. A pixel describes the same data as a byte.

| Name | Offset (in px) | Length (in px) | Data |
| ---  | ---    | ---    |   ---|
|Entry Indicator | 0 | 20 | Defines the entry point for reading data (X) as an offset.
| Entry | X | 20 | This data needs to be identical to the entry indicator. If this is the case, we can assume a message is hidden.
| Length Indicator | X+20 | 16| Sets the length of the message (L) **as bytes**.The message is constructed using node's buffers If this is longer than the image then we can assume an error.
|Message begin|X+36|L|The message in consecutive order.|
|Message end | X+36+L| - | End of message. There is no particular indicator for the end of the message as this in defined in the Length Indicator.