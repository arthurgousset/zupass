import * as fastfile from "fastfile";
import { CircuitArtifactPaths, CircuitDesc, CircuitSignal } from "./types";

export type VerificationKey = object;

/**
 * Loads a verification key from a JSON file.
 *
 * @param vkeyPath path to load artifacts, which could be a URL (in browser)
 *   or a file path (in server or utests).
 * @returns the verification key as an object
 * @throws if file access or JSON parsing fails
 */
export async function loadVerificationKey(
  vkeyPath: string
): Promise<VerificationKey> {
  // This method of binary loading files using fastfile is the same as what is
  // used in snarkjs to load pkey and wasm artifacts.  It works for local file
  // paths (in Node) as well as URLs (in browser).
  // The string decoding and JSON parsing is specific to our use of vkeys, which
  // snarkjs assumes are already in memory via import.
  let fd: fastfile.FastFile | undefined = undefined;
  try {
    fd = await fastfile.readExisting(vkeyPath);
    const bytes = await fd.read(fd.totalSize);
    return JSON.parse(Buffer.from(bytes).toString("utf8"));
  } finally {
    if (fd !== undefined) {
      await fd.close();
    }
  }
}

/**
 * Determines the right path for loading circuit artifacts for a given
 * circuit.
 *
 * @param root root path to load artifacts, which could be a URL (in browser)
 *   or a file path (in server or utests).
 * @param cd description of the GPC circuit
 * @returns collection of artifact paths
 */
export function gpcArtifactPaths(
  root: string,
  cd: CircuitDesc
): CircuitArtifactPaths {
  if (!root.endsWith("/")) {
    root = root + "/";
  }

  return {
    wasmPath: root + `${cd.family}_${cd.name}.wasm`,
    pkeyPath: root + `${cd.family}_${cd.name}-pkey.zkey`,
    vkeyPath: root + `${cd.family}_${cd.name}-vkey.json`
  };
}

/**
 * Returns an array which is a copy of `inputArray` extended to `totalLength`,
 * with new values filled with `fillValue` (default 0).  Input array is
 * returned as-is if `totalLength` is not longer than its length.
 */
export function extendedSignalArray(
  inputArray: CircuitSignal[],
  totalLength: number,
  fillValue = 0n
): CircuitSignal[] {
  if (totalLength <= inputArray.length) {
    return inputArray;
  }
  return inputArray.concat(
    new Array(totalLength - inputArray.length).fill(fillValue)
  );
}

/**
 * Convert an array of bit signals into a single packed bigint.
 * This will throw an Error if any of the elements is not 0 or 1.
 */
export function array2Bits(boolArray: bigint[]): bigint {
  let bits = 0n;
  for (let i = 0; i < boolArray.length; i++) {
    if (boolArray[i] !== 0n && boolArray[i] !== 1n) {
      throw new Error(
        `Input to array2Bits must be 0n or 1n not ${boolArray[i]}.`
      );
    }
    if (boolArray[i] === 1n) {
      bits |= 1n << BigInt(i);
    }
  }
  return bits;
}
