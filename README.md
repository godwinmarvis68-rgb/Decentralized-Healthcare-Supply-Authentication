# Decentralized Healthcare Supply Authentication

A decentralized platform for authenticating and tracking healthcare supplies, ensuring transparency, security, and trust in the supply chain to prevent counterfeit medications and equipment.

---

## Overview

Decentralized Healthcare Supply Authentication leverages blockchain technology to provide a transparent and tamper-proof system for verifying the authenticity of healthcare supplies. It uses 4 smart contracts built with Clarity to track products from manufacturers to end-users, ensuring patient safety and regulatory compliance.

1. **Supply Registry Contract** – Registers healthcare products and their metadata on-chain.
2. **Provenance Tracking Contract** – Tracks the supply chain journey of each product.
3. **Authenticity Verification Contract** – Verifies product authenticity for stakeholders.
4. **Stakeholder Access Contract** – Manages permissions for manufacturers, distributors, and regulators.

---

## Features

- **Product Registration**: Manufacturers register healthcare supplies with unique IDs and metadata.
- **Supply Chain Traceability**: Tracks products from production to delivery, logging each transfer.
- **Authenticity Checks**: Enables pharmacies, hospitals, and patients to verify product legitimacy.
- **Permissioned Access**: Restricts sensitive data access to authorized stakeholders.
- **Immutable Audit Trail**: Provides regulators with a transparent log of all transactions.
- **Counterfeit Prevention**: Ensures only verified products reach end-users.

---

## Smart Contracts

### Supply Registry Contract
- Registers healthcare products (e.g., medications, devices) with unique IDs.
- Stores metadata like batch number, manufacturing date, and expiry date.
- Allows manufacturers to update non-critical metadata (e.g., batch status).

### Provenance Tracking Contract
- Logs each transfer of a product (manufacturer → distributor → pharmacy).
- Records timestamps, locations, and stakeholder IDs.
- Ensures immutable provenance data for traceability.

### Authenticity Verification Contract
- Enables stakeholders (pharmacies, patients) to verify product authenticity using product IDs.
- Cross-references on-chain data with physical product details.
- Returns verification status (valid/invalid) and provenance history.

### Stakeholder Access Contract
- Manages roles and permissions for manufacturers, distributors, pharmacies, and regulators.
- Restricts sensitive data access (e.g., proprietary manufacturing details).
- Allows regulators to audit supply chain data without altering it.

---

## Installation

1. Install [Clarinet CLI](https://docs.hiro.so/clarinet/getting-started).
2. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/decentralized-healthcare-supply-authentication.git
   ```
3. Run tests:
    ```bash
    npm test
    ```
4. Deploy contracts:
    ```bash
    clarinet deploy
    ```

## Usage

Each smart contract is designed to work independently but integrates seamlessly to form a complete supply chain authentication system. Refer to individual contract documentation for function calls, parameters, and usage examples.

## License

MIT License

