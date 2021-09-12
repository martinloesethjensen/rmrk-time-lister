# rmrk-time-lister

This script will list an owners NFT with an amount to be increased linearly over a specified timeinterval.

[Follow LIST spec for RMRK::1.0.0 protocol](https://github.com/rmrk-team/rmrk-spec/blob/master/standards/rmrk1.0.0/interactions/list.md)

This script doesn't account for checking if NFT is belonging to the account address.

## Commands

Example

```sh
node run.js --id "<RMRK_ID>" -e wss://westend-rpc.polkadot.io -s .seed -a 0.1 -t 7
```

```text
Options:
  --help              Show help                                        [boolean]
  --version           Show version number                              [boolean]
  --id                A file with RMRK IDs.                  [string] [required]
  --endpoint, -e      The wss endpoint. [Westend =
                      wss://westend-rpc.polkadot.io] [Kusama =
                      wss://kusama-rpc.polkadot.io]          [string] [required]
  --secret-key, -s    A file with secret key or seed phrases. It is not saved
                      anywhere.                              [string] [required]
  --amount, -a        How much should be added linearly to the listing price
                                                                      [required]
  --timeinterval, -t  Timeinterval for listing in seconds             [required]
```
