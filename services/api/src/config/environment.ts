import { existsSync } from 'node:fs';
import { dirname, parse, resolve } from 'node:path';

const SECRET_MIN_LENGTH = 32;
const VALID_NODE_ENVS = new Set(['development', 'test', 'production']);
const VALID_PAYMENT_PROVIDERS = new Set(['MANUAL_TEST', 'STRIPE']);
const VALID_EMAIL_DELIVERY_MODES = new Set(['CONSOLE', 'SMTP']);
const VALID_PUSH_DELIVERY_MODES = new Set(['CONSOLE', 'FCM']);

function readString(
  config: Record<string, unknown>,
  key: string,
  options: { required?: boolean; minLength?: number } = {},
) {
  const raw = config[key];
  const value = typeof raw === 'string' ? raw.trim() : '';

  if (options.required && !value) {
    throw new Error(`[config] ${key} is required.`);
  }

  if (value && options.minLength && value.length < options.minLength) {
    throw new Error(
      `[config] ${key} must contain at least ${options.minLength} characters.`,
    );
  }

  return value;
}

function assertUrl(value: string, key: string) {
  if (!value) {
    return;
  }

  try {
    new URL(value);
  } catch {
    throw new Error(`[config] ${key} must be a valid absolute URL.`);
  }
}

function findApiRoot(startPath: string) {
  let current = resolve(startPath);
  const root = parse(current).root;

  while (true) {
    if (
      existsSync(resolve(current, 'package.json')) &&
      existsSync(resolve(current, 'prisma/schema.prisma'))
    ) {
      return current;
    }

    if (current === root) {
      return null;
    }

    current = dirname(current);
  }
}

export function resolveApiEnvFiles() {
  const candidates = new Set<string>();

  for (const startPath of [__dirname, process.cwd()]) {
    const apiRoot = findApiRoot(startPath);
    if (apiRoot) {
      candidates.add(resolve(apiRoot, '.env'));
    }
  }

  // Keep these fallbacks for source-mode execution and workspace-root scripts.
  candidates.add(resolve(process.cwd(), '.env'));
  candidates.add(resolve(process.cwd(), 'services/api/.env'));

  return Array.from(candidates);
}

export function validateEnvironment(config: Record<string, unknown>) {
  const databaseUrl = readString(config, 'DATABASE_URL', {
    required: true,
  });
  const authJwtSecret = readString(config, 'AUTH_JWT_SECRET', {
    required: true,
    minLength: SECRET_MIN_LENGTH,
  });
  const orderAccessSecret = readString(config, 'ORDER_ACCESS_SECRET', {
    required: true,
    minLength: SECRET_MIN_LENGTH,
  });

  if (authJwtSecret === orderAccessSecret) {
    throw new Error(
      '[config] AUTH_JWT_SECRET and ORDER_ACCESS_SECRET must be different secrets.',
    );
  }

  const nodeEnv = readString(config, 'NODE_ENV') || 'development';
  if (!VALID_NODE_ENVS.has(nodeEnv)) {
    throw new Error(
      '[config] NODE_ENV must be development, test, or production.',
    );
  }

  const portRaw = readString(config, 'PORT') || '3001';
  const port = Number(portRaw);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('[config] PORT must be an integer from 1 to 65535.');
  }

  const storefrontUrl =
    readString(config, 'STOREFRONT_URL') || 'http://localhost:3000';
  assertUrl(storefrontUrl, 'STOREFRONT_URL');

  const mediaPublicBaseUrl =
    readString(config, 'MEDIA_PUBLIC_BASE_URL') || `http://localhost:${port}`;
  assertUrl(mediaPublicBaseUrl, 'MEDIA_PUBLIC_BASE_URL');
  const mediaLocalRoot = readString(config, 'MEDIA_LOCAL_ROOT');

  const paymentProvider =
    readString(config, 'PAYMENT_PROVIDER') || 'MANUAL_TEST';
  if (!VALID_PAYMENT_PROVIDERS.has(paymentProvider)) {
    throw new Error(
      '[config] PAYMENT_PROVIDER must currently be MANUAL_TEST or STRIPE.',
    );
  }

  const stripeSecretKey = readString(config, 'STRIPE_SECRET_KEY');
  const stripeWebhookSecret = readString(
    config,
    'STRIPE_WEBHOOK_SECRET',
  );

  const emailDeliveryMode =
    readString(config, 'EMAIL_DELIVERY_MODE') || 'CONSOLE';
  if (!VALID_EMAIL_DELIVERY_MODES.has(emailDeliveryMode)) {
    throw new Error(
      '[config] EMAIL_DELIVERY_MODE must currently be CONSOLE or SMTP.',
    );
  }

  const pushEnabledRaw = readString(config, 'PUSH_ENABLED') || 'false';
  if (!['true', 'false'].includes(pushEnabledRaw.toLowerCase())) {
    throw new Error('[config] PUSH_ENABLED must be true or false.');
  }
  const pushEnabled = pushEnabledRaw.toLowerCase() === 'true';

  const pushDeliveryMode =
    (readString(config, 'PUSH_DELIVERY_MODE') || 'CONSOLE').toUpperCase();
  if (!VALID_PUSH_DELIVERY_MODES.has(pushDeliveryMode)) {
    throw new Error(
      '[config] PUSH_DELIVERY_MODE must currently be CONSOLE or FCM.',
    );
  }

  const fcmProjectId = readString(config, 'FCM_PROJECT_ID');
  if (pushEnabled && pushDeliveryMode === 'FCM' && !fcmProjectId) {
    throw new Error(
      '[config] FCM_PROJECT_ID is required when PUSH_ENABLED=true and PUSH_DELIVERY_MODE=FCM.',
    );
  }

  const emailFrom = readString(config, 'EMAIL_FROM');
  const smtpHost = readString(config, 'SMTP_HOST');
  const smtpPortRaw = readString(config, 'SMTP_PORT') || '587';
  const smtpPort = Number(smtpPortRaw);
  const smtpSecureRaw = readString(config, 'SMTP_SECURE') || 'false';
  const smtpUser = readString(config, 'SMTP_USER');
  const smtpPassword = readString(config, 'SMTP_PASSWORD');

  if (!Number.isInteger(smtpPort) || smtpPort < 1 || smtpPort > 65535) {
    throw new Error('[config] SMTP_PORT must be an integer from 1 to 65535.');
  }

  if (!['true', 'false'].includes(smtpSecureRaw.toLowerCase())) {
    throw new Error('[config] SMTP_SECURE must be true or false.');
  }

  if (emailDeliveryMode === 'SMTP') {
    if (!smtpHost) {
      throw new Error('[config] SMTP_HOST is required when EMAIL_DELIVERY_MODE=SMTP.');
    }
    if (!emailFrom) {
      throw new Error('[config] EMAIL_FROM is required when EMAIL_DELIVERY_MODE=SMTP.');
    }
    if ((smtpUser && !smtpPassword) || (!smtpUser && smtpPassword)) {
      throw new Error('[config] SMTP_USER and SMTP_PASSWORD must be configured together.');
    }
  }

  if (nodeEnv === 'production') {
    if (paymentProvider === 'MANUAL_TEST') {
      throw new Error(
        '[config] MANUAL_TEST payments are disabled when NODE_ENV=production.',
      );
    }

    if (emailDeliveryMode === 'CONSOLE') {
      throw new Error(
        '[config] CONSOLE email delivery is disabled when NODE_ENV=production.',
      );
    }

    if (pushEnabled && pushDeliveryMode === 'CONSOLE') {
      throw new Error(
        '[config] CONSOLE push delivery is disabled when NODE_ENV=production and PUSH_ENABLED=true.',
      );
    }

    if (paymentProvider === 'STRIPE') {
      if (!stripeSecretKey) {
        throw new Error(
          '[config] STRIPE_SECRET_KEY is required for production Stripe payments.',
        );
      }

      if (!stripeWebhookSecret) {
        throw new Error(
          '[config] STRIPE_WEBHOOK_SECRET is required for production Stripe payments.',
        );
      }
    }
  }

  return {
    ...config,
    DATABASE_URL: databaseUrl,
    AUTH_JWT_SECRET: authJwtSecret,
    ORDER_ACCESS_SECRET: orderAccessSecret,
    NODE_ENV: nodeEnv,
    PORT: port,
    STOREFRONT_URL: storefrontUrl,
    MEDIA_PUBLIC_BASE_URL: mediaPublicBaseUrl,
    MEDIA_LOCAL_ROOT: mediaLocalRoot,
    PAYMENT_PROVIDER: paymentProvider,
    STRIPE_SECRET_KEY: stripeSecretKey,
    STRIPE_WEBHOOK_SECRET: stripeWebhookSecret,
    EMAIL_DELIVERY_MODE: emailDeliveryMode,
    EMAIL_FROM: emailFrom,
    SMTP_HOST: smtpHost,
    SMTP_PORT: smtpPort,
    SMTP_SECURE: smtpSecureRaw.toLowerCase() === 'true',
    SMTP_USER: smtpUser,
    SMTP_PASSWORD: smtpPassword,
    PUSH_ENABLED: pushEnabled,
    PUSH_DELIVERY_MODE: pushDeliveryMode,
    FCM_PROJECT_ID: fcmProjectId,
  };
}
