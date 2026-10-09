const MODEL = '@cf/meta/m2m100-1.2b';

function chunks(text, limit = 1200) {
  const result = [];
  let rest = text;
  while (rest.length > limit) {
    let cut = rest.lastIndexOf(' ', limit);
    if (cut < limit / 2) cut = limit;
    result.push(rest.slice(0, cut));
    rest = rest.slice(cut).trimStart();
  }
  result.push(rest);
  return result;
}

async function translateText(ai, text, source, target) {
  const output = [];
  for (const paragraph of text.split('\n')) {
    if (!paragraph) { output.push(''); continue; }
    const translatedChunks = [];
    for (const chunk of chunks(paragraph)) {
      const result = await ai.run(MODEL, { text: chunk, source_lang: source, target_lang: target });
      const translated = result?.translated_text;
      if (typeof translated !== 'string' || !translated.trim()) throw new Error('Translation service returned no text.');
      translatedChunks.push(translated.trim());
    }
    output.push(translatedChunks.join(' '));
  }
  return output.join('\n');
}

export async function resolvePostTranslations(post, ai, existing = null) {
  if (post.title_en !== undefined) return post; // Existing API clients can still send both languages.
  const source = post.source_lang;
  const target = source === 'en' ? 'sw' : 'en';
  const titleKey = `title_${source}`;
  const bodyKey = `body_${source}`;
  const targetTitleKey = `title_${target}`;
  const targetBodyKey = `body_${target}`;
  const titleChanged = !existing || existing[titleKey] !== post.title;
  const bodyChanged = !existing || existing[bodyKey] !== post.description;
  if ((titleChanged || bodyChanged) && !ai?.run) {
    throw new Error('Automatic translation is not configured. Add a Workers AI binding named AI to the Pages project.');
  }
  const title = titleChanged ? await translateText(ai, post.title, source, target) : existing[targetTitleKey];
  const body = bodyChanged ? await translateText(ai, post.description, source, target) : existing[targetBodyKey];
  if (title.length > 160 || body.length > 10000) throw new Error('Translated post is too long. Shorten the title or description.');
  return {
    ...post,
    [titleKey]: post.title,
    [bodyKey]: post.description,
    [targetTitleKey]: title,
    [targetBodyKey]: body
  };
}
