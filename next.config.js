/** @type {import('next').NextConfig} */
module.exports = {
  // @huggingface/transformers ships native ONNX bindings that webpack can't
  // bundle. Mark it as an external so Next.js requires it at runtime instead.
  serverExternalPackages: ["@huggingface/transformers"],
};
