#![cfg(test)]

use soroban_sdk::{
    testutils::{Address as _, BytesN as _},
    Address, BytesN, Env, String, Vec,
};

use crate::{
    contract::{AlfredDidRegistry, AlfredDidRegistryClient},
    model::{DidKey, DidRecord},
};

fn client(e: &Env) -> (AlfredDidRegistryClient<'_>, Address) {
    let admin = Address::generate(e);
    let id = e.register(AlfredDidRegistry, (&admin,));
    (AlfredDidRegistryClient::new(e, &id), admin)
}

fn sample_record(e: &Env, controller: &Address) -> DidRecord {
    let mut auth = Vec::new(e);
    auth.push_back(DidKey {
        public_key_multibase: String::from_str(e, "z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK"),
    });
    DidRecord {
        controller: controller.clone(),
        authentication: auth,
        assertion_method: Vec::new(e),
        key_agreement: Vec::new(e),
        services: Vec::new(e),
        metadata_uri: None,
        metadata_hash: None,
        version: 0,
        created_ledger: 0,
        updated_ledger: 0,
        deactivated: true, // ignored on register
    }
}

#[test]
fn register_and_get() {
    let e = Env::default();
    e.mock_all_auths();
    let (c, admin) = client(&e);
    assert_eq!(c.get_admin(), admin);

    let controller = Address::generate(&e);
    let did_id = BytesN::<16>::random(&e);
    let record = sample_record(&e, &controller);
    c.register(&did_id, &record);

    let stored = c.get(&did_id).expect("record");
    assert_eq!(stored.controller, controller);
    assert_eq!(stored.version, 1);
    assert!(!stored.deactivated);
}

#[test]
fn deactivate() {
    let e = Env::default();
    e.mock_all_auths();
    let (c, _) = client(&e);
    let controller = Address::generate(&e);
    let did_id = BytesN::<16>::random(&e);
    c.register(&did_id, &sample_record(&e, &controller));
    c.deactivate(&did_id, &1);
    let stored = c.get(&did_id).unwrap();
    assert!(stored.deactivated);
    assert_eq!(stored.version, 2);
    assert_eq!(stored.authentication.len(), 0);
}
