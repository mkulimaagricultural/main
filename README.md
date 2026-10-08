# MAo website and updates CMS

Fungua `index.html` kwenye browser kuona ukurasa wa mwanzo wa Mkulima Agricultural Organization (MAo). Tovuti hii bado haijaunganishwa na Cloudflare Pages au domain. Msimbo wa CMS umeandaliwa, lakini login, database na image storage hazitafanya kazi mpaka huduma za Cloudflare zilizounganishwa hapa chini ziwekwe.

Lugha ya mwanzo ni English. Kichagua lugha kwenye navigation hubadilisha maudhui kati ya English na Kiswahili. Chaguo la mtumiaji huhifadhiwa kwenye browser yake; mtumiaji mpya huona English.

Typography: maandishi yote yasiyo headings hutumia Inter, ikiwa ni pamoja na lebo ndogo, namba za kadi na anuani. Headings zimebakia Fraunces. Sheria hizi ni zilezile kwa upana wote wa vifaa.

Heading, maelezo na vitufe vya sehemu ya mwanzo vinaingia kwa mpangilio mfupi vinapoonekana. Animation inacheza mara moja tu, na inazimwa kwa kifaa kilichoweka `prefers-reduced-motion: reduce`.

Maudhui ya shirika yametolewa kwenye *MAO KATIBA 2.docx*, toleo la kwanza la 2024. Hakuna takwimu za athari au miradi iliyotekelezwa iliyobuniwa. Update ya kwanza ya kikao cha waanzilishi imetolewa na MAo pamoja na picha yake; tarehe haijaongezwa kwa sababu haikutolewa. Inaonekana kwenye static preview na imeongezwa kama seed ya kwanza ya database ili isirudiwe baada ya kuunganisha CMS.

## CMS ya updates

Dashboard iko `/admin/`. Kila post ina kichwa na maelezo ya English/Kiswahili, picha ya hiari, na hali ya draft au published. Akaunti ya `poster` inaweza kuandika, kubadilisha na kuchapisha. Akaunti ya `reviewer` inaweza kusoma posts kwenye dashboard; haiwezi kubadilisha wala kuchapisha. Barua pepe za akaunti hizi huwekwa katika Cloudflare environment variables, si kwenye repo hii ya umma.

Endpoints za admin zinaangalia JWT iliyosainiwa na Cloudflare Access, audience, muda wa token, na barua pepe iliyoorodheshwa kwenye role husika. Cloudflare Access app pia lazima ilinde njia `/admin/*`. Hakuna password inayohifadhiwa kwenye tovuti. Upatikanaji wa picha ni kupitia R2; data za posts ni kupitia D1.

## Kuunganisha Cloudflare Pages

1. Unganisha GitHub repo `mkulimaagricultural/main` na Cloudflare Pages. Production branch: `main`; build command: `npm run build`; output directory: `dist`. Build huchapisha `index.html`, `admin/`, `assets/`, na `_routes.json` pekee. `functions/` zinabundle kama Pages Functions. `_routes.json` huita Functions kwa `/api/*` na `/admin/api/*` tu.
2. Tengeneza D1 database, kwa mfano `mao-updates`, na R2 bucket, kwa mfano `mao-media`. Ongeza bindings kwa Pages project: D1 variable `DB`, R2 variable `MEDIA`. Tumia `migrations/0001_posts.sql` mara moja kwenye D1 database. Hii inaongeza post ya kwanza iliyotolewa na MAo.
3. Katika Cloudflare Zero Trust, tengeneza Access self-hosted application kwa hostname ya tovuti na path `/admin/*`. Ruhusu barua pepe mbili zilizoidhinishwa na MAo kutumia login ya email OTP au identity provider inayofaa. Hakikisha protection inatumika pia kwenye preview domains kama utazitumia.
4. Katika Pages project environment variables, weka `ACCESS_TEAM_DOMAIN` (mfano `https://team-name.cloudflareaccess.com`), `ACCESS_AUD` (Application Audience tag ya Access app), `MAO_POSTER_EMAILS`, na `MAO_REVIEWER_EMAILS`. Tumia email za kila role zinazotolewa na MAo; thamani nyingi zitenganishwe kwa koma. Kwa usalama, ziweke kama secret ikiwa dashboard inatoa chaguo hilo. Weka values kwenye production na preview environments pale zinapohitajika.
5. Baada ya bindings na variables kuwekwa, redeploy Pages project, kisha pima akaunti zote mbili kwenye `/admin/`: poster aone editor na aweze kuchapisha; reviewer aone posts bila editor. Pima public updates katika English na Kiswahili. Unganisha custom domain `mkulimaagricultural.org` baada ya QA.

Kwa local development, `npm test` huendesha majaribio ya JWT na validation; `npm run build` hutengeneza `dist/`. Static preview pekee haiwezi kuthibitisha login au kuhifadhi posts bila Cloudflare bindings.

## Asili ya muonekano

CSS na JavaScript vya msingi vimetoka kwenye [Charitize NGO HTML template](https://github.com/uiuxlabz/charity-html-template). README ya mradi huo inaruhusu matumizi binafsi na ya kibiashara, na inasema attribution inathaminiwa lakini si lazima. Muundo na maudhui vimebadilishwa kwa MAo. Kagua masharti ya template tena kabla ya uchapishaji wa mwisho.

## Picha

`assets/img/hero-farm.jpg` ni picha ya mfano iliyotengenezwa kwa imagegen, si picha ya shamba au mradi wa MAo. Prompt: “A realistic, dignified high-resolution landscape of fertile smallholder farmland near Mbeya, Tanzania at warm early morning light. Neat rows of healthy crops, distant green hills, earth paths, a subtle glimpse of irrigation and sustainable farming. No identifiable people, no logos, no text, no buildings that imply a specific NGO project. Wide horizontal framing with darker open space on the left for overlaid heading. Authentic East African highland landscape, natural colors, editorial photography.”

`assets/img/mao-logo.png` imetokana na logo iliyotumwa na MAo; background yake imeondolewa kwa imagegen na imehifadhiwa kama PNG yenye transparency. Prompt ya uhariri: “Remove the off-white rectangular backdrop only. Keep exactly the same emblem design, including leaves, sun, hand, fields, colored arcs, shapes and colors. Produce a clean transparent PNG with alpha channel and no text, shadow, border or added objects.”

`assets/img/founders-meeting.jpg` ni picha iliyotumwa na MAo kwa update ya kwanza kuhusu kikao cha waanzilishi. Haijabadilishwa. Maelezo ya English yametafsiriwa kutoka maelezo ya Kiswahili yaliyotolewa na MAo.

Icons za mitandao zimetoka [Bootstrap Icons](https://github.com/twbs/icons), chini ya leseni ya MIT. Links za akaunti zimewekwa kama zilivyotumwa na MAo; upatikanaji wa kila ukurasa wa mitandao haukuweza kuthibitishwa moja kwa moja.

Barua pepe rasmi na anuani ya posta zimetolewa na MAo. Namba binafsi za viongozi, picha halisi, na taarifa za miradi ziongezwe baada ya MAo kuthibitisha zichapishwe hadharani.
