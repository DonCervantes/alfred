//! Public ABI for `alfred-vc-vault-factory`.

use soroban_sdk::{
    contract, contractimpl, contractmeta, panic_with_error, token, Address, BytesN, Env,
};

use crate::errors::FactoryError;
use crate::events;
use crate::model::FeeConfig;
use crate::storage;

contractmeta!(
    key = "Description",
    val = "alfred-vc-vault-factory: deploy ALFRED vaults and configure USDC issue fees"
);

#[contract]
pub struct AlfredVcVaultFactory;

#[contractimpl]
impl AlfredVcVaultFactory {
    pub fn __constructor(e: Env, admin: Address, vault_wasm_hash: BytesN<32>) {
        admin.require_auth();
        storage::set_admin(&e, &admin);
        storage::set_wasm_hash(&e, &vault_wasm_hash);
        storage::set_fee(
            &e,
            &FeeConfig {
                token: None,
                amount: 0,
                recipient: None,
            },
        );
        storage::extend_instance(&e);
        events::factory_initialized(&e, &admin);
    }

    /// Deploy a new vault for `owner` with deterministic `salt`.
    /// Constructor args: `(owner, Some(factory))`.
    pub fn deploy(e: Env, owner: Address, salt: BytesN<32>) -> Address {
        owner.require_auth();
        let wasm_hash = storage::get_wasm_hash(&e);
        let factory = e.current_contract_address();
        let vault = e
            .deployer()
            .with_current_contract(salt)
            .deploy_v2(wasm_hash, (owner.clone(), Some(factory)));
        storage::mark_vault(&e, &vault);
        storage::extend_instance(&e);
        events::vault_deployed(&e, &vault, &owner);
        vault
    }

    pub fn is_vault(e: Env, address: Address) -> bool {
        storage::is_vault(&e, &address)
    }

    pub fn get_vault_wasm_hash(e: Env) -> BytesN<32> {
        storage::get_wasm_hash(&e)
    }

    pub fn set_vault_wasm_hash(e: Env, vault_wasm_hash: BytesN<32>) {
        let admin = storage::get_admin(&e);
        admin.require_auth();
        storage::set_wasm_hash(&e, &vault_wasm_hash);
        storage::extend_instance(&e);
    }

    pub fn get_fee(e: Env) -> FeeConfig {
        storage::get_fee(&e)
    }

    /// Configure USDC (or any SAC) fee charged via `collect_issue_fee`.
    /// Pass `amount = 0` or `token = None` to disable.
    pub fn set_fee(e: Env, token: Option<Address>, amount: i128, recipient: Option<Address>) {
        let admin = storage::get_admin(&e);
        admin.require_auth();
        if amount < 0 {
            panic_with_error!(&e, FactoryError::FeeAmountInvalid);
        }
        if amount > 0 && (token.is_none() || recipient.is_none()) {
            panic_with_error!(&e, FactoryError::FeeNotConfigured);
        }
        let fee = FeeConfig {
            token,
            amount,
            recipient,
        };
        storage::set_fee(&e, &fee);
        storage::extend_instance(&e);
        events::fee_updated(&e, amount);
    }

    /// Collect the configured issue fee from `payer` (issuer). No-op if amount is 0.
    /// Bundle this auth in the same transaction as `vault.issue`.
    pub fn collect_issue_fee(e: Env, payer: Address) {
        payer.require_auth();
        let fee = storage::get_fee(&e);
        if fee.amount == 0 {
            return;
        }
        let token = match fee.token {
            Some(t) => t,
            None => panic_with_error!(&e, FactoryError::FeeNotConfigured),
        };
        let recipient = match fee.recipient {
            Some(r) => r,
            None => panic_with_error!(&e, FactoryError::FeeNotConfigured),
        };
        let client = token::Client::new(&e, &token);
        client.transfer(&payer, &recipient, &fee.amount);
        storage::extend_instance(&e);
        events::issue_fee_collected(&e, &payer, fee.amount);
    }

    pub fn quote_issue_fee(e: Env) -> i128 {
        storage::get_fee(&e).amount
    }

    pub fn get_admin(e: Env) -> Address {
        storage::get_admin(&e)
    }

    pub fn propose_admin(e: Env, new_admin: Address) {
        let admin = storage::get_admin(&e);
        admin.require_auth();
        storage::set_proposed_admin(&e, &new_admin);
        storage::extend_instance(&e);
    }

    pub fn accept_admin(e: Env) {
        match storage::get_proposed_admin(&e) {
            Some(proposed) => {
                proposed.require_auth();
                let old = storage::get_admin(&e);
                storage::set_admin(&e, &proposed);
                storage::remove_proposed_admin(&e);
                storage::extend_instance(&e);
                events::admin_transferred(&e, &old, &proposed);
            }
            None => panic_with_error!(&e, FactoryError::NoProposedAdmin),
        }
    }
}
