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

### How to validate prompt

```
curl -X POST http://localhost:3000/validate -d '{"prompt": "Will solana reach 200$ by 4th March 2025?"}' --header 'Content-Type: application/json'| jq
```
