import crypto from 'crypto';
import { config } from '@betoch/config';

export interface TelebirrInitParams {
  outTradeNo: string;
  amount: number;
  subject: string;
  notifyUrl: string;
  returnUrl: string;
}

export interface TelebirrInitResult {
  outTradeNo: string;
  payUrl: string;
  mode: 'live' | 'mock';
}

export class TelebirrService {
  private appId: string;
  private appKey: string;
  private privateKey: string;
  private publicKey: string;
  private mode: 'live' | 'mock';

  constructor() {
    this.appId = config.TELEBIRR_APP_ID;
    this.appKey = config.TELEBIRR_APP_KEY;
    this.privateKey = config.TELEBIRR_PRIVATE_KEY;
    this.publicKey = config.TELEBIRR_PUBLIC_KEY;
    this.mode = config.TELEBIRR_MODE as 'live' | 'mock';
  }

  /**
   * Generates RSA SHA256 signature for Telebirr payload
   */
  public signPayload(data: Record<string, any>): string {
    const sortedKeys = Object.keys(data).sort();
    const signString = sortedKeys.map((k) => `${k}=${data[k]}`).join('&');

    if (this.mode === 'mock') {
      return crypto.createHash('sha256').update(signString + this.appKey).digest('hex');
    }

    const signer = crypto.createSign('SHA256');
    signer.update(signString);
    signer.end();
    return signer.sign(this.privateKey, 'base64');
  }

  /**
   * Verifies Telebirr callback webhook RSA signature
   */
  public verifySignature(payload: Record<string, any>, signature: string): boolean {
    if (this.mode === 'mock') {
      const expectedMockSign = this.signPayload(payload);
      return signature === expectedMockSign || signature === 'MOCK_VALID_SIGNATURE';
    }

    try {
      const sortedKeys = Object.keys(payload).filter((k) => k !== 'sign' && k !== 'sign_type').sort();
      const verifyString = sortedKeys.map((k) => `${k}=${payload[k]}`).join('&');

      const verifier = crypto.createVerify('SHA256');
      verifier.update(verifyString);
      verifier.end();
      return verifier.verify(this.publicKey, signature, 'base64');
    } catch (err) {
      console.error('[Telebirr Signature Verification Error]', err);
      return false;
    }
  }

  /**
   * Initiates payment order
   */
  public async initiatePayment(params: TelebirrInitParams): Promise<TelebirrInitResult> {
    const timestamp = Date.now().toString();
    const nonce = crypto.randomBytes(16).toString('hex');

    const requestPayload = {
      appId: this.appId,
      outTradeNo: params.outTradeNo,
      totalAmount: params.amount.toFixed(2),
      subject: params.subject,
      notifyUrl: params.notifyUrl,
      returnUrl: params.returnUrl,
      timestamp,
      nonce
    };

    const signature = this.signPayload(requestPayload);

    if (this.mode === 'mock') {
      // Return simulated mock payment redirect URL
      const mockPayUrl = `${params.returnUrl}?outTradeNo=${params.outTradeNo}&amount=${params.amount}&mock=true&sign=${signature}`;
      return {
        outTradeNo: params.outTradeNo,
        payUrl: mockPayUrl,
        mode: 'mock'
      };
    }

    // In live mode, call official Telebirr gateway
    const response = await fetch(config.TELEBIRR_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...requestPayload, sign: signature, sign_type: 'SHA256WithRSA' })
    });

    const data: any = await response.json();
    if (data.code !== 0 && data.code !== 200) {
      throw new Error(`Telebirr Gateway error: ${data.msg || 'Transaction rejected'}`);
    }

    return {
      outTradeNo: params.outTradeNo,
      payUrl: data.data?.toPayUrl || data.toPayUrl,
      mode: 'live'
    };
  }
}

export const telebirrService = new TelebirrService();
