# Clairvoy - a prediction market resolved by AI

Clairvoy is an AI-powered prediction market live on the Sonic Frontier V1 testnet. It operates on a fixed product market maker model, where $x * y = k$, with $x$ and $y$ representing the liquidity of different shares, and $k$ remaining constant.

Here's an abstracted program architecture

![Image](https://github.com/user-attachments/assets/5183c8cb-d4ff-4170-bf89-723453601ddc)

Anyone can create a new market with a prompt and initialise it with a minimum of `1_000_000` lamports. This creates a new market with the chosen expiry that would be resolved as and when expiry is reached. 

The resolution is automatic and managed by an agent swarm. The following is the basic agent swarm architecture we use to resolve the market. Currently we only support politics and prices.

![Image](https://github.com/user-attachments/assets/e4ce08b7-676d-4513-8919-4c1a7a7b0cee)

### How is market resolved?

The server runs an event listener for the anchor events which catches the emitted events and runs a cron job to settle them using the agent swarm. The market prompt is passed as a state to the graph agent which using the context of the current information, resolves the market as Yes or No.

## Getting Started

### Prerequisites

- Node v18.18.0 or higher

- Rust v1.77.2 or higher
- Anchor CLI 0.30.1 or higher
- Solana CLI 1.18.17 or higher

### Installation

#### Clone the repo

```shell
git clone <repo-url>
cd <repo-name>
```

#### Install Dependencies

```shell
pnpm install
```

#### Start the web app

```
pnpm run dev
```
