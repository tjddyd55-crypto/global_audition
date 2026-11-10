#!/usr/bin/env bash
set -euo pipefail

# Opt-in Railway Development command. Never make this the shared startCommand.
if [[ "${RAILWAY_ENVIRONMENT_NAME:-}" != "Development" && "${RAILWAY_ENVIRONMENT_NAME:-}" != "development" ]]; then
  echo 'Refusing to start: this command is for Railway Development only.' >&2
  exit 64
fi
if [[ -n "${JAVA_TOOL_OPTIONS:-}" || -n "${JDK_JAVA_OPTIONS:-}" || -n "${_JAVA_OPTIONS:-}" ]]; then
  echo 'Refusing conflicting inherited JVM options; review them securely before using this command.' >&2
  exit 64
fi

cd "$(dirname "${BASH_SOURCE[0]}")/.."
shopt -s nullglob
jars=(target/*.jar)
if [[ ${#jars[@]} -ne 1 ]]; then
  echo 'Expected one packaged application jar in backend/target.' >&2
  exit 66
fi

diagnostics=()
if [[ "${DEVELOPMENT_MEMORY_DIAGNOSTICS:-false}" == "true" ]]; then
  diagnostics=(-XX:NativeMemoryTracking=summary)
fi

# Low-traffic candidate, not a container limit. Keep native-memory headroom and
# the existing metaspace/code-cache caps. Do not cap stacks/direct buffers blindly.
exec java -Xms64m -Xmx384m -XX:+UseSerialGC \
  -XX:MaxMetaspaceSize=192m -XX:ReservedCodeCacheSize=64m \
  -XX:+UseContainerSupport -XX:+ExitOnOutOfMemoryError \
  "${diagnostics[@]}" -jar "${jars[0]}" \
  --spring.profiles.include=development-memory
