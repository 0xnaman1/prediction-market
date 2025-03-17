# gringots

_the AI hedge fund for Crypto._

.env file

```
RPC_URL=
SOLANA_PRIVATE_KEY=
OPENAI_API_KEY=
```

https://js.langchain.com/v0.1/docs/modules/model_io/chat/custom_chat/

TODO:

- [ ] take input of the expiry timestamp and use that rather than the bet's prompt.

## explaining naman's lil brain

- Shares, TotalSupply, SolStaked

Shares ∝ TotalSupply

1. Shares To Reduce

since Shares ∝ TotalSupply
x shares = y tokens

k tokens to burn

k tokens = (x / y) \* k shares
shares to reduce = (x / y) \* k shares;

2. After settlement, sol to withdraw.

k tokens to burn after winning the bet.

Yes shares ∝ SolStaked

yes shares to burn = (x / y) \* k shares = z;

a shares = b sol
z shares = (b / a) \* z sol = (b/a) \* (x / y) \* k

### How to validate prompt

```
curl -X POST http://localhost:3000/validate -d '{"prompt": "Will solana reach 200$ by 4th March 2025?"}' --header 'Content-Type: application/json'| jq
```
