import { registerAs } from '@nestjs/config';

export default registerAs('rustTestnet', () => ({
  // Path ke binary solana-test-validator hasil install solana-cli (Rust toolchain).
  // Di CI/Docker, pastikan PATH sudah include ~/.local/share/solana/install/active_release/bin
  binaryPath: process.env.RUST_TESTNET_BIN ?? 'solana-test-validator',
  ledgerDir: process.env.RUST_TESTNET_LEDGER_DIR ?? './test-ledger',
  rpcPort: Number(process.env.RUST_TESTNET_RPC_PORT ?? 8899),
  faucetPort: Number(process.env.RUST_TESTNET_FAUCET_PORT ?? 9900),
  // Program .so hasil `anchor build`, di-load otomatis saat validator start (opsional, untuk E2E)
  programsToLoad: (process.env.RUST_TESTNET_PROGRAMS ?? '')
    .split(',')
    .filter(Boolean)
    .map((pair) => {
      const [programId, soPath] = pair.split('=');
      return { programId, soPath };
    }),
  healthCheckIntervalMs: 500,
  healthCheckTimeoutMs: 30_000,
  shutdownGraceMs: 5_000,
}));
