# MAo website and updates CMS

Tovuti ya Mkulima Agricultural Organization (MAo) iko kwenye Cloudflare Pages, ikichapishwa kutoka `mkulimaagricultural/main` kwenda `mkulimaagricultural.org` na `www.mkulimaagricultural.org`. D1 `mao-updates` na R2 `mao-media` tayari zimefungwa kwenye Pages kwa majina `DB` na `MEDIA`. CMS ya admin inahitaji hatua za Access na migration zilizoelezwa hapa chini.

Lugha ya mwanzo ni English. Kichagua lugha kwenye navigation hubadilisha maudhui kati ya English na Kiswahili. Chaguo la mtumiaji huhifadhiwa kwenye browser yake; mtumiaji mpya huona English.

## PWA za website na MAo Studio

Website ya umma ina manifest `/manifest.webmanifest` (scope `/`) na service worker `/sw.js`. Inatumia icon za MAo zenye vipimo vya 192px na 512px, Apple touch icon, pamoja na rangi ya MAo. Kurasa za umma zilizotembelewa na assets zake zinaweza kufunguka bila mtandao; ukurasa ambao haujahifadhiwa unaonyesha `/offline.html`. API na kurasa za taarifa za CMS hazihifadhiwi na service worker, kwa hiyo taarifa mpya zinahitaji mtandao.

MAo Studio ina manifest yake `/admin/manifest.webmanifest` (scope `/admin/`) na service worker `/admin/sw.js`. Inaweza kusakinishwa kama app tofauti, lakini inahitaji mtandao na Cloudflare Access ili kusoma au kuandika posts. Service worker ya Studio haihifadhi kurasa za admin, maudhui ya posts, wala majibu ya `/admin/api/`; ikiwa offline inaonyesha ujumbe wa kuunganishwa tena. Kuingia na kuchapisha kunaendelea kufuata ulinzi wa Access uliopo.

Kurasa za umma ni home `/`, About `/about/`, Our focus `/focus/`, Updates `/updates/`, Contact `/contact/`, na Donate `/donate/`. Navigation ya home inafungua kurasa hizi. Sehemu za home zimebakia vilevile; menyu ina kitufe kipya cha Donate. Kurasa zinatumia mfumo uleule wa lugha na muonekano wa MAo. Ukurasa wa Updates unasoma posts zilizochapishwa kutoka CMS, huku update ya kwanza ikiwa fallback wakati API haipatikani.

Ukurasa wa Donate unaonyesha maelezo ya akaunti ya CRDB yaliyotolewa moja kwa moja na MAo. Ni maelekezo ya bank transfer; tovuti haisindiki malipo mtandaoni. `assets/img/crdb-logo.svg` imetolewa na MAo na hutumika kama nembo ya benki kwenye ukurasa huo. Favicon na branding ya tovuti vinaendelea kutumia nembo ya MAo.

Typography: maandishi yote yasiyo headings hutumia Inter, ikiwa ni pamoja na lebo ndogo, namba za kadi na anuani. Headings zimebakia Fraunces. Sheria hizi ni zilezile kwa upana wote wa vifaa.

Heading, maelezo na vitufe vya sehemu ya mwanzo vinaingia kwa mpangilio mfupi vinapoonekana. Animation inacheza mara moja tu, na inazimwa kwa kifaa kilichoweka `prefers-reduced-motion: reduce`.

Maudhui ya shirika yametolewa kwenye *MAO KATIBA 2.docx*, toleo la kwanza la 2024. Hakuna takwimu za athari au miradi iliyotekelezwa iliyobuniwa. Update ya kwanza ya kikao cha waanzilishi imetolewa na MAo pamoja na picha yake; tarehe haijaongezwa kwa sababu haikutolewa. Inaonekana kwenye static preview na imeongezwa kama seed ya kwanza ya database ili isirudiwe baada ya kuunganisha CMS.

## CMS ya updates

Dashboard iko `https://admin.mkulimaagricultural.org/admin/`; root ya subdomain hiyo inaelekeza huko. Public domain ikifunguliwa kwa `/admin/` inaelekezwa kwenye admin subdomain; admin API kwenye public domain inakataliwa. Dashboard hutumia Tabler (MIT), na ina orodha ya posts, tarehe, draft/published, views za kufungua ukurasa wa post, kubadili picha, Trash na Restore. Views ni makadirio ya ufunguzi wa ukurasa, yanaweza kujumuisha bots na si idadi ya watu wa kipekee. Kila post ina English na Kiswahili; published huonekana moja kwa moja kwenye public website. Admin wawili wana uwezo sawa. Barua pepe zao huwekwa kwenye Cloudflare environment variable, si kwenye repo hii ya umma.

Endpoints za admin zinaangalia hostname na JWT iliyosainiwa na Cloudflare Access, audience, muda wa token, na barua pepe zilizoidhinishwa. Cloudflare Access app lazima ilinde hostname `admin.mkulimaagricultural.org` nzima. Hakuna password inayohifadhiwa kwenye tovuti. Picha ziko R2 na data za posts ziko D1.

## Kuunganisha Cloudflare Pages

1. GitHub `mkulimaagricultural/main` iko kwenye Cloudflare Pages project `mkulimaagricultural`, production branch `main`, build `npm run build`, output `dist`. `functions/` hubundle kama Pages Functions. Build huweka Tabler CSS ndani ya `dist/assets/vendor/tabler/`; hakuna Tabler CDN inayohitajika.
2. D1 `mao-updates` tayari ina `migrations/0001_posts.sql` na post ya kwanza. Endesha `migrations/0002_cms.sql` kwenye D1 Console; ni additive na idempotent. Inaunda `post_meta` kwa views, Trash, na attribution ya admin. Hifadhi taarifa zilizopo; usirudie kuunda D1 au R2.
3. Katika Pages project `mkulimaagricultural` > Custom domains, ongeza `admin.mkulimaagricultural.org`. Cloudflare itaongeza DNS record inayohitajika kwenye zone yake. Hakikisha status ni Active/SSL enabled.
4. Katika Cloudflare Zero Trust, tengeneza Access self-hosted application kwa hostname `admin.mkulimaagricultural.org` bila path, ili subdomain nzima ilindwe. Policy iruhusu **tu** barua pepe mbili za admin zilizotolewa na MAo, kwa usawa. Tumia login ya email OTP au identity provider inayofaa. Hakikisha hakuna bypass policy.
5. Katika Pages production environment variables/secrets, weka `ACCESS_TEAM_DOMAIN` (mfano `https://team-name.cloudflareaccess.com`), `ACCESS_AUD` (Application Audience tag ya Access app), na `MAO_ADMIN_EMAILS` (barua pepe mbili za admin zilizotolewa na MAo, zikitenganishwa kwa koma). Redeploy Pages baada ya mabadiliko ya variables.
6. Pima login kwa kila admin, kuandika draft, kupublish, kubadili picha, Trash/Restore, na public page ya post. Epuka kupima kwa data bandia kwenye production; tumia post halisi ya MAo au draft.

Kwa local development, `npm test` huendesha majaribio ya JWT na validation; `npm run build` hutengeneza `dist/`. Static preview haiwezi kuthibitisha login au kuhifadhi posts bila Cloudflare bindings. Public API ina fallback ya kusoma posts zilizopo wakati `0002_cms.sql` haijaendeshwa, ili deployment isikatishe public updates.

## Picha nyingi na video (migration 0003)

Ili kuanzisha media nyingi kwa kila post, endesha `migrations/0003_post_media.sql` katika Cloudflare D1 `mao-updates` **baada** ya migration 0002. Migration hii inaunda `post_media`, inahifadhi `posts.image_url` kwa compatibility, na inahamisha picha zilizopo kwenye jedwali jipya bila kuzifuta. Inaweza kuendeshwa tena kwa usalama.

Kwenye MAo Studio, chagua picha nyingi kwa wakati mmoja au ongeza mara kwa mara; hakuna limit ya idadi ya picha kwa post iliyowekwa na CMS. JPEG/PNG/WebP: kila picha <= 15,000,000 bytes (15 MB). MP4/WebM: kila video <= 90,000,000 bytes (90 MB). Files zinapakiwa moja baada ya nyingine kwa stream kwenda R2; sio lazima kuhifadhi video yote kwenye memory ya Worker. Kiasi cha jumla cha picha kinategemea storage na resource za cloud (sio unlimited storage).

Frontend hutuma `media` array ya vitu vya aina `{url, type}` na API inahifadhi mpangilio wake. Mfumo wa zamani wa `image_url` na post ya kwanza unabaki, na legacy API clients zinazotuma picha moja pekee bado zinafanya kazi. Public homepage inaonyesha cover image au video, ukurasa wa kila taarifa unaonyesha media zote na video controls. Media endpoint inaruhusu HTTP Range requests kwa video.

**Muundo wa hatua za rollout:** endesha 0003 D1 migration kwanza, ndipo deploy frontend/backend mpya kwenye Pages. Kabla ya migration, static legacy image posts zitaonekana lakini editing mpya yenye attachments inaweza kukataliwa. Hakuna haja ya kubadilisha D1/R2 bindings au Access settings.

## Asili ya muonekano

CSS na JavaScript vya msingi vimetoka kwenye [Charitize NGO HTML template](https://github.com/uiuxlabz/charity-html-template). README ya mradi huo inaruhusu matumizi binafsi na ya kibiashara, na inasema attribution inathaminiwa lakini si lazima. Muundo na maudhui vimebadilishwa kwa MAo. Kagua masharti ya template tena kabla ya uchapishaji wa mwisho.

Dashboard hutumia [Tabler](https://github.com/tabler/tabler), chini ya leseni ya MIT. Build inakopi Tabler CSS pekee; haiingizi libraries za third party zilizo kwenye distribution yake.

## Picha

`assets/img/hero-farm.jpg` ni picha ya mfano iliyotengenezwa kwa imagegen, si picha ya shamba au mradi wa MAo. Prompt: “A realistic, dignified high-resolution landscape of fertile smallholder farmland near Mbeya, Tanzania at warm early morning light. Neat rows of healthy crops, distant green hills, earth paths, a subtle glimpse of irrigation and sustainable farming. No identifiable people, no logos, no text, no buildings that imply a specific NGO project. Wide horizontal framing with darker open space on the left for overlaid heading. Authentic East African highland landscape, natural colors, editorial photography.”

`assets/img/mao-logo.png` imetokana na logo iliyotumwa na MAo; background yake imeondolewa kwa imagegen na imehifadhiwa kama PNG yenye transparency. Prompt ya uhariri: “Remove the off-white rectangular backdrop only. Keep exactly the same emblem design, including leaves, sun, hand, fields, colored arcs, shapes and colors. Produce a clean transparent PNG with alpha channel and no text, shadow, border or added objects.”

`assets/img/founders-meeting.jpg` ni picha iliyotumwa na MAo kwa update ya kwanza kuhusu kikao cha waanzilishi. Haijabadilishwa. Maelezo ya English yametafsiriwa kutoka maelezo ya Kiswahili yaliyotolewa na MAo.

Icons za mitandao zimetoka [Bootstrap Icons](https://github.com/twbs/icons), chini ya leseni ya MIT. Links za akaunti zimewekwa kama zilivyotumwa na MAo; upatikanaji wa kila ukurasa wa mitandao haukuweza kuthibitishwa moja kwa moja.

Barua pepe rasmi na anuani ya posta zimetolewa na MAo. Namba binafsi za viongozi, picha halisi, na taarifa za miradi ziongezwe baada ya MAo kuthibitisha zichapishwe hadharani.

