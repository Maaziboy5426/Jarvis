export async function executeSequence(sequence, handlers, { onStep } = {}) {
  const steps = Array.isArray(sequence) ? sequence : [];
  for (let idx = 0; idx < steps.length; idx += 1) {
    const action = steps[idx];
    const type = action?.type;
    if (typeof onStep === 'function') {
      try {
        onStep({ idx, action });
      } catch {
        // ignore
      }
    }

    if (!type) continue;
    const handler = handlers?.[type];
    if (typeof handler !== 'function') continue;
    // Ensure each step can be async
    await handler(action);
  }
}

