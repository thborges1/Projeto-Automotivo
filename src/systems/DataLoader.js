// JSON é dado, não módulo JavaScript. Erros chegam ao tratamento de inicialização.
export async function loadJSON(url, fetcher = globalThis.fetch) {
  const response = await fetcher(url);
  if (!response.ok) throw new Error(`Falha ao carregar dados (${response.status}): ${url}`);
  return response.json();
}
