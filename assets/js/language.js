(() => {
  'use strict';

  const messages = {
    en: {
      metaDescription: 'Mkulima Agricultural Organization (MAo) aims to empower women and young farmers through productive, sustainable agriculture.',
      skipLink: 'Skip to content', mainNavigation: 'Main navigation', maoHome: 'MAo home',
      navAbout: 'About us', navFocus: 'Our focus', navUpdates: 'Updates', navContact: 'Contact us',
      languageLabel: 'Website language', openMenu: 'Open menu', closeMenu: 'Close menu',
      heroTitlePrefix: 'Agriculture is ', heroTitleAccent: 'Life',
      heroLead: 'We aim to empower women and young people through knowledge, resources, and opportunities in productive, sustainable agriculture.',
      heroFocus: 'Explore our focus', heroAbout: 'About MAo',
      aboutLabel: 'About us', aboutTitle: 'Women and young farmers at the heart of change',
      aboutBody1: 'MAo is a nongovernmental organization founded to support women and young farmers in Tanzania. Its constitution sets out an ambition to address food insecurity, climate change, losses from limited farming knowledge, lack of market access, and youth unemployment.',
      aboutBody2: 'The constitution places the head office in Uyole, Mbeya District, Mbeya Region. It describes Mainland Tanzania and Zanzibar as the intended area of operation.',
      aboutSource: 'These details come from the first edition of the MAo constitution, dated 2024.',
      focusLabel: 'Our focus', focusTitlePrefix: 'Pathways to ', focusTitleAccent: 'productive farming',
      focusIntro: 'These are goals stated in the constitution. We will distinguish them from completed projects when verified activity reports are available.',
      card1Title: 'Farmer training', card1Body: 'Equip women and young people with skills for productive, modern farming.',
      card2Title: 'Sustainable agriculture', card2Body: 'Promote farming practices that respond to climate change.',
      card3Title: 'Crop value addition', card3Body: 'Build knowledge in crop care, processing, and value addition.',
      card4Title: 'Market access', card4Body: 'Help members reach domestic and international markets for their produce.',
      card5Title: 'Entrepreneurship', card5Body: 'Offer education that can strengthen household income and livelihoods.',
      card6Title: 'Partnerships', card6Body: 'Work with government, international organizations, and development partners on agricultural initiatives.',
      visionLabel: 'Our vision', visionBody: 'MAo believes productive, sustainable, modern agriculture is a foundation for community and economic development in Tanzania.',
      missionLabel: 'Our mission', missionTitle: 'Knowledge and opportunity',
      missionBody: 'Provide training, resources, and employment opportunities for women and young people to build economic independence through valuable, sustainable agriculture.',
      updatesLabel: 'News and updates', updatesTitle: 'Updates from MAo',
      updatesIntro: 'We will publish verified information about activities, training, and opportunities here.',
      updatesEmptyTitle: 'Updates are coming', updatesEmptyBody: 'No update has been published yet. This section will connect to a CMS so the MAo team can publish posts directly.',
      contactLabel: 'Contact us', contactTitle: "Let's advance agriculture together",
      contactBody: 'Reach MAo using the official email and postal address below.',
      contactEmailLabel: 'Email', contactPostLabel: 'Postal address',
      contactLocation: 'Uyole · Mbeya District · Tanzania', socialMedia: 'Social media', footerFollow: 'Follow Us', footerRights: 'All rights reserved.'
    },
    sw: {
      metaDescription: 'Mkulima Agricultural Organization (MAo) inalenga kuwawezesha wanawake na vijana kupitia kilimo chenye tija na endelevu.',
      skipLink: 'Ruka hadi maudhui', mainNavigation: 'Urambazaji mkuu', maoHome: 'MAo mwanzo',
      navAbout: 'Kuhusu sisi', navFocus: 'Tunacholenga', navUpdates: 'Taarifa', navContact: 'Wasiliana nasi',
      languageLabel: 'Lugha ya tovuti', openMenu: 'Fungua menyu', closeMenu: 'Funga menyu',
      heroTitlePrefix: 'Kilimo ni ', heroTitleAccent: 'Uhai',
      heroLead: 'Tunadhamiria kuwawezesha wanawake na vijana kupitia maarifa, rasilimali na fursa za kilimo chenye tija na endelevu.',
      heroFocus: 'Jua tunacholenga', heroAbout: 'Kuhusu MAo',
      aboutLabel: 'Kuhusu sisi', aboutTitle: 'Wakulima wanawake na vijana mbele ya mabadiliko',
      aboutBody1: 'MAo ni shirika lisilo la kiserikali lililoanzishwa kwa lengo la kuwasaidia wakulima wanawake na vijana wa Tanzania. Katiba yake inaeleza dhamira ya kukabiliana na upungufu wa chakula, athari za mabadiliko ya tabianchi, hasara za kilimo kisicho cha kitaalamu, uhaba wa masoko na ukosefu wa ajira kwa vijana.',
      aboutBody2: 'Ofisi kuu imeainishwa kuwa Uyole, Wilaya ya Mbeya, Mkoa wa Mbeya. Kwa mujibu wa katiba, eneo la utendaji linalokusudiwa ni Tanzania Bara na Zanzibar.',
      aboutSource: 'Maelezo haya yametolewa kwenye Katiba ya MAo, toleo la kwanza la 2024.',
      focusLabel: 'Tunacholenga', focusTitlePrefix: 'Njia za kukuza ', focusTitleAccent: 'kilimo chenye tija',
      focusIntro: 'Haya ni madhumuni yaliyoandikwa kwenye katiba. Tutatenganisha malengo na miradi iliyotekelezwa wakati taarifa za shughuli zitakapopatikana.',
      card1Title: 'Mafunzo kwa wakulima', card1Body: 'Kuwawezesha wanawake na vijana katika uzalishaji wa kisasa wenye tija.',
      card2Title: 'Kilimo endelevu', card2Body: 'Kuhamasisha mbinu za kilimo zinazoendana na mabadiliko ya tabianchi.',
      card3Title: 'Thamani ya mazao', card3Body: 'Kukuza uelewa wa utunzaji, usindikaji na uongezaji wa thamani wa mazao.',
      card4Title: 'Masoko', card4Body: 'Kuwezesha upatikanaji wa masoko ya ndani na nje kwa mazao ya wanachama.',
      card5Title: 'Ujasiriamali', card5Body: 'Kutoa elimu inayosaidia kuimarisha kipato na uchumi wa familia.',
      card6Title: 'Ushirikiano', card6Body: 'Kushirikiana na serikali, mashirika ya kimataifa na wadau wa maendeleo katika miradi ya kilimo.',
      visionLabel: 'Dira yetu', visionBody: 'MAo inaamini kwamba kilimo chenye tija, endelevu na cha kisasa ni msingi wa maendeleo ya jamii na uchumi wa Tanzania.',
      missionLabel: 'Dhamira yetu', missionTitle: 'Maarifa na fursa',
      missionBody: 'Kutoa mafunzo, rasilimali na fursa za ajira kwa wanawake na vijana ili waweze kujitegemea kiuchumi kupitia kilimo chenye thamani na endelevu.',
      updatesLabel: 'Taarifa na habari', updatesTitle: 'Updates za MAo',
      updatesIntro: 'Hapa tutachapisha taarifa za shughuli, mafunzo na fursa mara zitakapothibitishwa na shirika.',
      updatesEmptyTitle: 'Taarifa zinakuja', updatesEmptyBody: 'Hakuna update iliyochapishwa bado. Sehemu hii itaunganishwa na CMS ili timu ya MAo iweze kupost yenyewe.',
      contactLabel: 'Wasiliana nasi', contactTitle: 'Tushirikiane kuendeleza kilimo',
      contactBody: 'Wasiliana na MAo kupitia barua pepe rasmi na anuani ya posta hapa chini.',
      contactEmailLabel: 'Barua pepe', contactPostLabel: 'Sanduku la posta',
      contactLocation: 'Uyole · Wilaya ya Mbeya · Tanzania', socialMedia: 'Mitandao ya kijamii', footerFollow: 'Tufuatilie', footerRights: 'Haki zote zimehifadhiwa.'
    }
  };

  const picker = document.getElementById('language-select');
  const menuButton = document.querySelector('.nav__toggle');
  const copyrightYear = document.getElementById('copyright-year');
  if (copyrightYear) copyrightYear.textContent = String(new Date().getFullYear());
  if (!picker) return;

  function applyLanguage(language) {
    const locale = messages[language] ? language : 'en';
    const copy = messages[locale];
    document.documentElement.lang = locale;
    picker.value = locale;
    document.querySelector('meta[name="description"]').content = copy.metaDescription;
    document.querySelectorAll('[data-i18n]').forEach((element) => {
      const value = copy[element.dataset.i18n];
      if (value !== undefined) element.textContent = value;
    });
    document.querySelectorAll('[data-i18n-aria]').forEach((element) => {
      const value = copy[element.dataset.i18nAria];
      if (value !== undefined) element.setAttribute('aria-label', value);
    });
    if (menuButton) {
      menuButton.setAttribute('aria-label', copy[menuButton.getAttribute('aria-expanded') === 'true' ? 'closeMenu' : 'openMenu']);
    }
  }

  let savedLanguage = 'en';
  try {
    savedLanguage = localStorage.getItem('mao-language') || 'en';
  } catch (_) { /* The language switch still works if storage is unavailable. */ }
  applyLanguage(savedLanguage);

  picker.addEventListener('change', () => {
    applyLanguage(picker.value);
    try { localStorage.setItem('mao-language', picker.value); } catch (_) { /* Optional preference. */ }
  });
  if (menuButton) {
    menuButton.addEventListener('click', () => {
      const copy = messages[picker.value];
      menuButton.setAttribute('aria-label', copy[menuButton.getAttribute('aria-expanded') === 'true' ? 'closeMenu' : 'openMenu']);
    });
  }
})();

