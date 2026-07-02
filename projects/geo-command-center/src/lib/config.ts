export function isOpenAccessMode(): boolean {
  return process.env.OPEN_ACCESS_MODE === "true";
}

