import { expect } from "chai";
import { formatFrontendConfig } from "../scripts/deploymentOutput.js";

describe("deployment output", function () {
  it("prints copy-ready Vite configuration for the deployed address and block", function () {
    expect(formatFrontendConfig("0x1234567890123456789012345678901234567890", 18130000)).to.equal(
      "VITE_CONTRACT_ADDRESS=0x1234567890123456789012345678901234567890\n" +
        "VITE_CONTRACT_DEPLOY_BLOCK=18130000"
    );
  });
});
