#![cfg(test)]

use soroban_sdk::{
    testutils::Address as _,
    token::{StellarAssetClient, TokenClient},
    Address, BytesN, Env,
};

use crate::{
    contract::{AlfredVcVaultFactory, AlfredVcVaultFactoryClient},
    model::FeeConfig,
};

mod vault_wasm {
    soroban_sdk::contractimport!(
        file = "../../target/wasm32v1-none/release/alfred_vc_vault.wasm"
    );
}

fn setup(e: &Env) -> (AlfredVcVaultFactoryClient<'_>, Address, BytesN<32>) {
    let admin = Address::generate(e);
    let wasm_hash = e.deployer().upload_contract_wasm(vault_wasm::WASM);
    let id = e.register(AlfredVcVaultFactory, (&admin, wasm_hash.clone()));
    (
        AlfredVcVaultFactoryClient::new(e, &id),
        admin,
        wasm_hash,
    )
}

#[test]
fn deploy_vault_and_is_vault() {
    let e = Env::default();
    e.mock_all_auths();
    let (factory, admin, wasm_hash) = setup(&e);
    assert_eq!(factory.get_admin(), admin);
    assert_eq!(factory.get_vault_wasm_hash(), wasm_hash);

    let owner = Address::generate(&e);
    let salt = BytesN::from_array(&e, &[7u8; 32]);
    let vault = factory.deploy(&owner, &salt);

    assert!(factory.is_vault(&vault));
    assert!(!factory.is_vault(&Address::generate(&e)));
}

#[test]
fn fee_disabled_by_default() {
    let e = Env::default();
    e.mock_all_auths();
    let (factory, _, _) = setup(&e);
    assert_eq!(factory.quote_issue_fee(), 0);
    let fee = factory.get_fee();
    assert_eq!(
        fee,
        FeeConfig {
            token: None,
            amount: 0,
            recipient: None,
        }
    );
    // no-op when amount is 0
    factory.collect_issue_fee(&Address::generate(&e));
}

#[test]
fn collect_issue_fee_transfers_token() {
    let e = Env::default();
    e.mock_all_auths();
    let (factory, admin, _) = setup(&e);

    let token_admin = Address::generate(&e);
    let sac = e.register_stellar_asset_contract_v2(token_admin.clone());
    let token_id = sac.address();
    let recipient = Address::generate(&e);
    let payer = Address::generate(&e);

    StellarAssetClient::new(&e, &token_id).mint(&payer, &1_000_000);
    factory.set_fee(&Some(token_id.clone()), &100, &Some(recipient.clone()));
    assert_eq!(factory.quote_issue_fee(), 100);

    factory.collect_issue_fee(&payer);
    assert_eq!(TokenClient::new(&e, &token_id).balance(&payer), 999_900);
    assert_eq!(TokenClient::new(&e, &token_id).balance(&recipient), 100);

    // keep admin used
    assert_eq!(factory.get_admin(), admin);
}
