//! Contract events.

use soroban_sdk::{Address, Env, Symbol};

pub fn factory_initialized(e: &Env, admin: &Address) {
    e.events()
        .publish((Symbol::new(e, "init"),), admin.clone());
}

pub fn vault_deployed(e: &Env, vault: &Address, owner: &Address) {
    e.events().publish(
        (Symbol::new(e, "deployed"), vault.clone()),
        owner.clone(),
    );
}

pub fn fee_updated(e: &Env, amount: i128) {
    e.events()
        .publish((Symbol::new(e, "fee"),), amount);
}

pub fn issue_fee_collected(e: &Env, payer: &Address, amount: i128) {
    e.events().publish(
        (Symbol::new(e, "issue_fee"), payer.clone()),
        amount,
    );
}

pub fn admin_transferred(e: &Env, from: &Address, to: &Address) {
    e.events()
        .publish((Symbol::new(e, "admin"),), (from.clone(), to.clone()));
}
