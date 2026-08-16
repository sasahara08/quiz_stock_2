import { describe, it, expect, vi, beforeEach } from "vitest";
import { isPrivateIp, validateSsrf } from "../ssrf-guard";

vi.mock("node:dns/promises", () => ({
  default: { resolve4: vi.fn() },
}));

import dns from "node:dns/promises";
const mockResolve4 = vi.mocked(dns.resolve4);

describe("isPrivateIp", () => {
  describe("IPv4 loopback", () => {
    it("returns true for 127.0.0.1", () => {
      expect(isPrivateIp("127.0.0.1")).toBe(true);
    });
    it("returns true for 127.255.255.255", () => {
      expect(isPrivateIp("127.255.255.255")).toBe(true);
    });
  });

  describe("IPv4 private ranges", () => {
    it("returns true for 10.0.0.1 (10/8)", () => {
      expect(isPrivateIp("10.0.0.1")).toBe(true);
    });
    it("returns true for 10.255.255.255 (10/8)", () => {
      expect(isPrivateIp("10.255.255.255")).toBe(true);
    });
    it("returns true for 172.16.0.1 (172.16/12)", () => {
      expect(isPrivateIp("172.16.0.1")).toBe(true);
    });
    it("returns true for 172.31.255.255 (172.16/12)", () => {
      expect(isPrivateIp("172.31.255.255")).toBe(true);
    });
    it("returns true for 192.168.0.1 (192.168/16)", () => {
      expect(isPrivateIp("192.168.0.1")).toBe(true);
    });
    it("returns true for 192.168.255.255 (192.168/16)", () => {
      expect(isPrivateIp("192.168.255.255")).toBe(true);
    });
  });

  describe("link-local / cloud metadata", () => {
    it("returns true for 169.254.0.1 (link-local)", () => {
      expect(isPrivateIp("169.254.0.1")).toBe(true);
    });
    it("returns true for 169.254.169.254 (AWS metadata)", () => {
      expect(isPrivateIp("169.254.169.254")).toBe(true);
    });
  });

  describe("IPv6 private / loopback", () => {
    it("returns true for ::1 (IPv6 loopback)", () => {
      expect(isPrivateIp("::1")).toBe(true);
    });
    it("returns true for fc00:: (unique local)", () => {
      expect(isPrivateIp("fc00::")).toBe(true);
    });
    it("returns true for fe80:: (link-local)", () => {
      expect(isPrivateIp("fe80::")).toBe(true);
    });
  });

  describe("public IPs", () => {
    it("returns false for 8.8.8.8 (Google DNS)", () => {
      expect(isPrivateIp("8.8.8.8")).toBe(false);
    });
    it("returns false for 1.1.1.1 (Cloudflare)", () => {
      expect(isPrivateIp("1.1.1.1")).toBe(false);
    });
    it("returns false for 203.0.113.1 (TEST-NET)", () => {
      expect(isPrivateIp("203.0.113.1")).toBe(false);
    });
    it("returns false for 172.15.255.255 (just below 172.16/12)", () => {
      expect(isPrivateIp("172.15.255.255")).toBe(false);
    });
    it("returns false for 172.32.0.0 (just above 172.16/12)", () => {
      expect(isPrivateIp("172.32.0.0")).toBe(false);
    });
  });
});

describe("validateSsrf", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("throws AppError for hostname resolving to private IP", async () => {
    mockResolve4.mockResolvedValue(["192.168.1.1"]);
    await expect(validateSsrf("internal.example.com")).rejects.toMatchObject({
      code: "FORBIDDEN_URL",
    });
  });

  it("throws AppError for hostname resolving to loopback", async () => {
    mockResolve4.mockResolvedValue(["127.0.0.1"]);
    await expect(validateSsrf("localhost.example.com")).rejects.toMatchObject({
      code: "FORBIDDEN_URL",
    });
  });

  it("throws AppError for hostname resolving to metadata IP", async () => {
    mockResolve4.mockResolvedValue(["169.254.169.254"]);
    await expect(validateSsrf("metadata.example.com")).rejects.toMatchObject({
      code: "FORBIDDEN_URL",
    });
  });

  it("resolves without error for public IP hostname", async () => {
    mockResolve4.mockResolvedValue(["1.1.1.1"]);
    await expect(validateSsrf("example.com")).resolves.toBeUndefined();
  });

  it("throws AppError when DNS resolution fails", async () => {
    mockResolve4.mockRejectedValue(new Error("ENOTFOUND"));
    await expect(validateSsrf("no-such-host.invalid")).rejects.toMatchObject({
      code: "FORBIDDEN_URL",
    });
  });

  it("blocks IP address string 127.0.0.1 directly (no DNS needed)", async () => {
    await expect(validateSsrf("127.0.0.1")).rejects.toMatchObject({
      code: "FORBIDDEN_URL",
    });
    expect(mockResolve4).not.toHaveBeenCalled();
  });

  it("allows public IP address string directly (no DNS needed)", async () => {
    await expect(validateSsrf("8.8.8.8")).resolves.toBeUndefined();
    expect(mockResolve4).not.toHaveBeenCalled();
  });
});
