# rmrk-time-lister

This script will list an owner's NFT with an amount to be increased or decreased linearly over a specified timeinterval.

It can essentially be used as an English or Dutch auction script for RMRK 1.0.0 protocol. 

[Follow LIST spec for RMRK::1.0.0 protocol](https://github.com/rmrk-team/rmrk-spec/blob/master/standards/rmrk1.0.0/interactions/list.md)

This script doesn't account for checking if NFT is belonging to the account address.

## Commands

Example

```sh
node run.js --id "<RMRK_ID>" -e wss://westend-rpc.polkadot.io -s .seed -a 0.1 -t 7
```

```text
Options:
      --help          Show help                                        [boolean]
      --version       Show version number                              [boolean]
      --id            A file with RMRK IDs.                  [string] [required]
  -e, --endpoint      The wss endpoint. [Westend =
                      wss://westend-rpc.polkadot.io] [Kusama =
                      wss://kusama-rpc.polkadot.io]          [string] [required]
  -s, --secret-key    A file with secret key or seed phrases. It is not saved
                      anywhere.                              [string] [required]
  -a, --amount        How much should be added linearly to the listing price
                                                                      [required]
  -t, --timeinterval  Timeinterval for listing in seconds             [required]
      --start-amount  The starting amount for listing
      --limit         The limit amount for listing
      --decrease      Flag for decreasing the listing [boolean] [default: false]
```

## Tipping

KSM address

```text
HtSKUKWRPCxCtzsnNfdbN1NN5uVq4yMizb2FqeHSC3YoRTi
```
