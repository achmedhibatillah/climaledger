use anchor_lang::prelude::*;
use anchor_spl::token::{self, Burn, Mint, MintTo, Token, TokenAccount, Transfer};

declare_id!("CLiMA1edgerCarbonCreditProgram1111111111111");

#[program]
pub mod climaledger {
    use super::*;

    /// Inisialisasi registry batch karbon kredit baru
    pub fn initialize_batch(
        ctx: Context<InitializeBatch>,
        batch_id: String,
        standard: String,
        vintage: u16,
        total_supply: u64,
    ) -> Result<()> {
        let batch_account = &mut ctx.accounts.batch_account;
        batch_account.authority = ctx.accounts.authority.key();
        batch_account.mint = ctx.accounts.mint.key();
        batch_account.batch_id = batch_id;
        batch_account.standard = standard;
        batch_account.vintage = vintage;
        batch_account.total_supply = total_supply;
        batch_account.remaining = total_supply;
        batch_account.minted = 0;
        batch_account.bump = ctx.bumps.batch_account;

        emit!(BatchInitializedEvent {
            batch_id: batch_account.batch_id.clone(),
            standard: batch_account.standard.clone(),
            vintage,
            total_supply,
        });

        Ok(())
    }

    /// Tokenisasi kredit karbon: Mint SPL Token ke Associated Token Account (ATA) pemilik
    pub fn tokenize_credit(
        ctx: Context<TokenizeCredit>,
        amount: u64,
    ) -> Result<()> {
        let batch_account = &mut ctx.accounts.batch_account;
        require!(batch_account.remaining >= amount, ErrorCode::InsufficientRemaining);

        // Mint token ke ATA penerima
        let seeds = &[
            b"batch".as_ref(),
            batch_account.batch_id.as_bytes(),
            &[batch_account.bump],
        ];
        let signer = &[&seeds[..]];

        let cpi_accounts = MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.recipient_token_account.to_account_info(),
            authority: batch_account.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::mint_to(cpi_ctx, amount)?;

        batch_account.remaining = batch_account.remaining.checked_sub(amount).unwrap();
        batch_account.minted = batch_account.minted.checked_add(amount).unwrap();

        emit!(CreditTokenizedEvent {
            batch_id: batch_account.batch_id.clone(),
            amount,
            recipient: ctx.accounts.recipient.key(),
            mint: ctx.accounts.mint.key(),
        });

        Ok(())
    }

    /// Listing kredit karbon ke marketplace (escrow lock)
    pub fn list_market(
        ctx: Context<ListMarket>,
        amount: u64,
        price_per_unit_usdc: u64,
    ) -> Result<()> {
        let listing = &mut ctx.accounts.listing_account;
        listing.seller = ctx.accounts.seller.key();
        listing.mint = ctx.accounts.mint.key();
        listing.amount = amount;
        listing.price_per_unit_usdc = price_per_unit_usdc;
        listing.active = true;
        listing.bump = ctx.bumps.listing_account;

        // Transfer token karbon ke vault escrow
        let cpi_accounts = Transfer {
            from: ctx.accounts.seller_token_account.to_account_info(),
            to: ctx.accounts.escrow_vault.to_account_info(),
            authority: ctx.accounts.seller.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;

        emit!(MarketListingEvent {
            listing: listing.key(),
            seller: listing.seller,
            mint: listing.mint,
            amount,
            price_per_unit_usdc,
        });

        Ok(())
    }

    /// Beli kredit karbon dari marketplace dengan USDC
    pub fn buy_market(
        ctx: Context<BuyMarket>,
        amount: u64,
    ) -> Result<()> {
        let listing = &mut ctx.accounts.listing_account;
        require!(listing.active, ErrorCode::ListingNotActive);
        require!(listing.amount >= amount, ErrorCode::InsufficientListingAmount);

        let total_usdc = amount.checked_mul(listing.price_per_unit_usdc).unwrap();

        // 1. Transfer USDC dari pembeli ke penjual
        let usdc_cpi_accounts = Transfer {
            from: ctx.accounts.buyer_usdc_account.to_account_info(),
            to: ctx.accounts.seller_usdc_account.to_account_info(),
            authority: ctx.accounts.buyer.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        token::transfer(CpiContext::new(cpi_program.clone(), usdc_cpi_accounts), total_usdc)?;

        // 2. Transfer Karbon Token dari Escrow Vault ke Pembeli
        let seeds = &[
            b"listing".as_ref(),
            listing.seller.as_ref(),
            listing.mint.as_ref(),
            &[listing.bump],
        ];
        let signer = &[&seeds[..]];

        let carbon_cpi_accounts = Transfer {
            from: ctx.accounts.escrow_vault.to_account_info(),
            to: ctx.accounts.buyer_carbon_account.to_account_info(),
            authority: listing.to_account_info(),
        };
        token::transfer(
            CpiContext::new_with_signer(cpi_program, carbon_cpi_accounts, signer),
            amount,
        )?;

        listing.amount = listing.amount.checked_sub(amount).unwrap();
        if listing.amount == 0 {
            listing.active = false;
        }

        emit!(MarketPurchaseEvent {
            listing: listing.key(),
            buyer: ctx.accounts.buyer.key(),
            amount,
            total_usdc,
        });

        Ok(())
    }

    /// Retire (Burn) token kredit karbon untuk kompensasi emisi (offsetting)
    pub fn retire_credit(
        ctx: Context<RetireCredit>,
        amount: u64,
        beneficiary: String,
        reason: String,
    ) -> Result<()> {
        // Burn token dari account pemegang
        let cpi_accounts = Burn {
            mint: ctx.accounts.mint.to_account_info(),
            from: ctx.accounts.holder_token_account.to_account_info(),
            authority: ctx.accounts.holder.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        token::burn(CpiContext::new(cpi_program, cpi_accounts), amount)?;

        let cert = &mut ctx.accounts.certificate_account;
        cert.holder = ctx.accounts.holder.key();
        cert.mint = ctx.accounts.mint.key();
        cert.amount = amount;
        cert.beneficiary = beneficiary.clone();
        cert.reason = reason.clone();
        cert.timestamp = Clock::get()?.unix_timestamp;

        emit!(RetirementCertificateEvent {
            certificate: cert.key(),
            holder: cert.holder,
            mint: cert.mint,
            amount,
            beneficiary,
            reason,
            timestamp: cert.timestamp,
        });

        Ok(())
    }

    /// Catat verifikasi ISO 14064 / KYB di on-chain
    pub fn attest_compliance(
        ctx: Context<AttestCompliance>,
        company_id: String,
        doc_hash: String,
        is_verified: bool,
    ) -> Result<()> {
        let attestation = &mut ctx.accounts.attestation_account;
        attestation.authority = ctx.accounts.authority.key();
        attestation.company_id = company_id.clone();
        attestation.doc_hash = doc_hash.clone();
        attestation.is_verified = is_verified;
        attestation.updated_at = Clock::get()?.unix_timestamp;

        emit!(ComplianceAttestedEvent {
            company_id,
            doc_hash,
            is_verified,
        });

        Ok(())
    }
}

// ----------------- ACCOUNTS -----------------

#[derive(Accounts)]
#[instruction(batch_id: String)]
pub struct InitializeBatch<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 32 + 64 + 16 + 2 + 8 + 8 + 8 + 1,
        seeds = [b"batch", batch_id.as_bytes()],
        bump
    )]
    pub batch_account: Account<'info, BatchAccount>,
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct TokenizeCredit<'info> {
    #[account(
        mut,
        has_one = mint,
        seeds = [b"batch", batch_account.batch_id.as_bytes()],
        bump = batch_account.bump
    )]
    pub batch_account: Account<'info, BatchAccount>,
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub recipient_token_account: Account<'info, TokenAccount>,
    pub recipient: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ListMarket<'info> {
    #[account(
        init,
        payer = seller,
        space = 8 + 32 + 32 + 8 + 8 + 1 + 1,
        seeds = [b"listing", seller.key().as_ref(), mint.key().as_ref()],
        bump
    )]
    pub listing_account: Account<'info, ListingAccount>,
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub seller_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub escrow_vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub seller: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct BuyMarket<'info> {
    #[account(
        mut,
        seeds = [b"listing", listing_account.seller.as_ref(), listing_account.mint.as_ref()],
        bump = listing_account.bump
    )]
    pub listing_account: Account<'info, ListingAccount>,
    #[account(mut)]
    pub escrow_vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub buyer_carbon_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub buyer_usdc_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub seller_usdc_account: Account<'info, TokenAccount>,
    pub buyer: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct RetireCredit<'info> {
    #[account(
        init,
        payer = holder,
        space = 8 + 32 + 32 + 8 + 64 + 128 + 8,
        seeds = [b"cert", holder.key().as_ref(), &Clock::get().unwrap().unix_timestamp.to_le_bytes()],
        bump
    )]
    pub certificate_account: Account<'info, CertificateAccount>,
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub holder_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub holder: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(company_id: String)]
pub struct AttestCompliance<'info> {
    #[account(
        init_if_needed,
        payer = authority,
        space = 8 + 32 + 64 + 64 + 1 + 8,
        seeds = [b"compliance", company_id.as_bytes()],
        bump
    )]
    pub attestation_account: Account<'info, ComplianceAttestationAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

// ----------------- STATE -----------------

#[account]
pub struct BatchAccount {
    pub authority: Pubkey,
    pub mint: Pubkey,
    pub batch_id: String,
    pub standard: String,
    pub vintage: u16,
    pub total_supply: u64,
    pub remaining: u64,
    pub minted: u64,
    pub bump: u8,
}

#[account]
pub struct ListingAccount {
    pub seller: Pubkey,
    pub mint: Pubkey,
    pub amount: u64,
    pub price_per_unit_usdc: u64,
    pub active: bool,
    pub bump: u8,
}

#[account]
pub struct CertificateAccount {
    pub holder: Pubkey,
    pub mint: Pubkey,
    pub amount: u64,
    pub beneficiary: String,
    pub reason: String,
    pub timestamp: i64,
}

#[account]
pub struct ComplianceAttestationAccount {
    pub authority: Pubkey,
    pub company_id: String,
    pub doc_hash: String,
    pub is_verified: bool,
    pub updated_at: i64,
}

// ----------------- EVENTS -----------------

#[event]
pub struct BatchInitializedEvent {
    pub batch_id: String,
    pub standard: String,
    pub vintage: u16,
    pub total_supply: u64,
}

#[event]
pub struct CreditTokenizedEvent {
    pub batch_id: String,
    pub amount: u64,
    pub recipient: Pubkey,
    pub mint: Pubkey,
}

#[event]
pub struct MarketListingEvent {
    pub listing: Pubkey,
    pub seller: Pubkey,
    pub mint: Pubkey,
    pub amount: u64,
    pub price_per_unit_usdc: u64,
}

#[event]
pub struct MarketPurchaseEvent {
    pub listing: Pubkey,
    pub buyer: Pubkey,
    pub amount: u64,
    pub total_usdc: u64,
}

#[event]
pub struct RetirementCertificateEvent {
    pub certificate: Pubkey,
    pub holder: Pubkey,
    pub mint: Pubkey,
    pub amount: u64,
    pub beneficiary: String,
    pub reason: String,
    pub timestamp: i64,
}

#[event]
pub struct ComplianceAttestedEvent {
    pub company_id: String,
    pub doc_hash: String,
    pub is_verified: bool,
}

// ----------------- ERRORS -----------------

#[error_code]
pub enum ErrorCode {
    #[msg("Jumlah remaining batch tidak mencukupi untuk di-mint.")]
    InsufficientRemaining,
    #[msg("Listing sudah tidak aktif.")]
    ListingNotActive,
    #[msg("Jumlah token yang tersedia di listing tidak mencukupi.")]
    InsufficientListingAmount,
}

