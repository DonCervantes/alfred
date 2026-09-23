#![cfg(test)]

use soroban_sdk::{
    testutils::{Address as _, BytesN as _},
    Address, BytesN, Env, String, Vec,
};

use crate::{
    contract::{AlfredVcVault, AlfredVcVaultClient},
    model::{IssueArgs, IssuanceMode, VcStatus},
};

fn client(e: &Env) -> (AlfredVcVaultClient<'_>, Address) {
    let owner = Address::generate(e);
    let id = e.register(AlfredVcVault, (&owner, Option::<Address>::None));
    (AlfredVcVaultClient::new(e, &id), owner)
}

#[test]
fn issue_get_verify_revoke() {
    let e = Env::default();
    e.mock_all_auths();
    let (c, owner) = client(&e);
    assert_eq!(c.get_owner(), owner);
    assert_eq!(c.vc_count(), 0);

    let issuer = Address::generate(&e);
    let vc_id = BytesN::<32>::random(&e);
    let hash = BytesN::<32>::random(&e);
    c.issue(&issuer, &vc_id, &hash, &None);

    let rec = c.get_vc(&vc_id).expect("vc");
    assert_eq!(rec.issuer, issuer);
    assert_eq!(rec.content_hash, hash);
    assert!(matches!(rec.status, VcStatus::Active));
    assert_eq!(c.vc_count(), 1);
    assert!(c.verify_vc(&vc_id, &hash));
    assert!(!c.verify_vc(&vc_id, &BytesN::<32>::random(&e)));

    c.revoke(&issuer, &vc_id);
    let rec = c.get_vc(&vc_id).unwrap();
    assert!(matches!(rec.status, VcStatus::Revoked));
    assert!(!c.verify_vc(&vc_id, &hash));
}

#[test]
fn batch_issue_and_list() {
    let e = Env::default();
    e.mock_all_auths();
    let (c, _) = client(&e);
    let issuer = Address::generate(&e);

    let mut items = Vec::new(&e);
    let id1 = BytesN::<32>::random(&e);
    let id2 = BytesN::<32>::random(&e);
    items.push_back(IssueArgs {
        vc_id: id1.clone(),
        content_hash: BytesN::<32>::random(&e),
        uri: Some(String::from_str(&e, "https://alfred.example/vc/1")),
    });
    items.push_back(IssueArgs {
        vc_id: id2.clone(),
        content_hash: BytesN::<32>::random(&e),
        uri: None,
    });
    c.batch_issue(&issuer, &items);

    let ids = c.list_vc_ids();
    assert_eq!(ids.len(), 2);
    assert_eq!(ids.get_unchecked(0), id1);
    assert_eq!(ids.get_unchecked(1), id2);
}

#[test]
fn allowlist_blocks_unknown_issuer() {
    let e = Env::default();
    e.mock_all_auths();
    let (c, _) = client(&e);
    c.set_issuance_mode(&IssuanceMode::Allowlist);

    let stranger = Address::generate(&e);
    let vc_id = BytesN::<32>::random(&e);
    let hash = BytesN::<32>::random(&e);
    let result = c.try_issue(&stranger, &vc_id, &hash, &None);
    assert!(result.is_err());

    let allowed = Address::generate(&e);
    c.allow_issuer(&allowed);
    c.issue(&allowed, &vc_id, &hash, &None);
    assert!(c.get_vc(&vc_id).is_some());
}

#[test]
fn owner_can_revoke() {
    let e = Env::default();
    e.mock_all_auths();
    let (c, owner) = client(&e);
    let issuer = Address::generate(&e);
    let vc_id = BytesN::<32>::random(&e);
    let hash = BytesN::<32>::random(&e);
    c.issue(&issuer, &vc_id, &hash, &None);
    c.revoke(&owner, &vc_id);
    assert!(matches!(
        c.get_vc(&vc_id).unwrap().status,
        VcStatus::Revoked
    ));
}
