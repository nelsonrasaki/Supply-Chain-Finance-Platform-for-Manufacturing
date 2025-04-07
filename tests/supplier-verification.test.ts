import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the Clarity contract environment
const mockContractEnv = {
  blockHeight: 100,
  txSender: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  admin: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  verifiedSuppliers: new Map(),
  
  // Mock contract functions
  registerSupplier(companyName, industry) {
    const caller = this.txSender;
    
    if (this.verifiedSuppliers.has(caller)) {
      return { type: 'err', value: 1 };
    }
    
    this.verifiedSuppliers.set(caller, {
      'company-name': companyName,
      'verification-date': this.blockHeight,
      'is-verified': false,
      'industry': industry,
      'verification-score': 0
    });
    
    return { type: 'ok', value: true };
  },
  
  verifySupplier(supplier, verificationScore) {
    if (this.txSender !== this.admin) {
      return { type: 'err', value: 2 };
    }
    
    if (!this.verifiedSuppliers.has(supplier)) {
      return { type: 'err', value: 3 };
    }
    
    const supplierData = this.verifiedSuppliers.get(supplier);
    supplierData['is-verified'] = true;
    supplierData['verification-date'] = this.blockHeight;
    supplierData['verification-score'] = verificationScore;
    this.verifiedSuppliers.set(supplier, supplierData);
    
    return { type: 'ok', value: true };
  },
  
  isSupplierVerified(supplier) {
    if (!this.verifiedSuppliers.has(supplier)) {
      return false;
    }
    return this.verifiedSuppliers.get(supplier)['is-verified'];
  },
  
  isSupplierRegistered(supplier) {
    return this.verifiedSuppliers.has(supplier);
  },
  
  getSupplierDetails(supplier) {
    if (!this.verifiedSuppliers.has(supplier)) {
      return null;
    }
    return this.verifiedSuppliers.get(supplier);
  }
};

describe('Supplier Verification Contract', () => {
  beforeEach(() => {
    // Reset the mock environment before each test
    mockContractEnv.verifiedSuppliers.clear();
    mockContractEnv.blockHeight = 100;
    mockContractEnv.txSender = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    mockContractEnv.admin = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
  });
  
  it('should register a new supplier', () => {
    const result = mockContractEnv.registerSupplier('Acme Parts', 'Manufacturing');
    
    expect(result.type).toBe('ok');
    expect(mockContractEnv.isSupplierRegistered(mockContractEnv.txSender)).toBe(true);
    
    const supplierDetails = mockContractEnv.getSupplierDetails(mockContractEnv.txSender);
    expect(supplierDetails['company-name']).toBe('Acme Parts');
    expect(supplierDetails['industry']).toBe('Manufacturing');
    expect(supplierDetails['is-verified']).toBe(false);
  });
  
  it('should not register a supplier twice', () => {
    mockContractEnv.registerSupplier('Acme Parts', 'Manufacturing');
    const result = mockContractEnv.registerSupplier('Acme Parts 2', 'Manufacturing');
    
    expect(result.type).toBe('err');
    expect(result.value).toBe(1);
  });
  
  it('should verify a supplier when called by admin', () => {
    // Register a supplier first
    const supplier = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
    mockContractEnv.txSender = supplier;
    mockContractEnv.registerSupplier('Supplier Corp', 'Electronics');
    
    // Verify the supplier as admin
    mockContractEnv.txSender = mockContractEnv.admin;
    const result = mockContractEnv.verifySupplier(supplier, 85);
    
    expect(result.type).toBe('ok');
    expect(mockContractEnv.isSupplierVerified(supplier)).toBe(true);
    
    const supplierDetails = mockContractEnv.getSupplierDetails(supplier);
    expect(supplierDetails['verification-score']).toBe(85);
  });
  
  it('should not verify a supplier when called by non-admin', () => {
    // Register a supplier first
    const supplier = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
    mockContractEnv.txSender = supplier;
    mockContractEnv.registerSupplier('Supplier Corp', 'Electronics');
    
    // Try to verify as non-admin
    mockContractEnv.txSender = 'ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP';
    const result = mockContractEnv.verifySupplier(supplier, 85);
    
    expect(result.type).toBe('err');
    expect(result.value).toBe(2);
    expect(mockContractEnv.isSupplierVerified(supplier)).toBe(false);
  });
  
  it('should not verify a non-registered supplier', () => {
    mockContractEnv.txSender = mockContractEnv.admin;
    const result = mockContractEnv.verifySupplier('ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG', 85);
    
    expect(result.type).toBe('err');
    expect(result.value).toBe(3);
  });
});
