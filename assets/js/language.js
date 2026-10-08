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
      updatesIntro: 'News and activities shared by the MAo team.',
      updatesFirstTag: 'MAo update', updatesFirstTitle: 'Founders discuss climate-resilient agriculture',
      updatesFirstBody: "In an internal meeting, MAo's founders discussed ways to support communities through climate-resilient agriculture and responses to climate change.",
      updatesFirstAlt: 'MAo founders seated around a table during an internal meeting',
      contactLabel: 'Contact us', contactTitle: "Let's advance agriculture together",
      contactBody: 'Reach MAo using the official email and postal address below.',
      contactEmailLabel: 'Email', contactPostLabel: 'Postal address',
      contactEmailGeneral: 'General enquiries', contactEmailSupport: 'Support', contactEmailDonations: 'Donations', contactEmailBen: 'Ben', contactEmailExisting: 'Existing contact email',
      contactLocation: 'Uyole · Mbeya District · Tanzania', socialMedia: 'Social media', footerFollow: 'Follow Us', footerRights: 'All rights reserved.',
      homeLabel: 'Home', aboutPageTitle: 'About us | MAo', focusPageTitle: 'Our focus | MAo', updatesPageTitle: 'Updates | MAo', contactPageTitle: 'Contact | MAo',
      aboutStoryTitle: 'Who we are', aboutPrinciplesTitle: 'What guides us', focusAreasTitle: 'Our six focus areas',
      latestUpdatesTitle: 'Latest updates', contactDetailsTitle: 'Ways to reach us',
      aboutPageMeta: 'Learn about Mkulima Agricultural Organization, its mission, vision and roots in Mbeya, Tanzania.',
      focusPageMeta: 'Explore the goals of Mkulima Agricultural Organization in training, sustainable farming, value addition and markets.',
      updatesPageMeta: 'Read news and updates shared by Mkulima Agricultural Organization in English and Kiswahili.',
      contactPageMeta: 'Contact Mkulima Agricultural Organization in Uyole, Mbeya, Tanzania.',
      aboutPageLead: 'Rooted in Mbeya, MAo is working toward a future where women and young people can build livelihoods through sustainable agriculture.',
      aboutPageStory: 'Our constitution describes the challenges we want to address and the communities we intend to serve. As our work grows, we will share verified activities and results here.',
      focusPageLead: 'Our constitution sets out six connected areas of work. These are organizational goals, and will be updated with verified project information as it becomes available.',
      updatesPageLead: 'Stories and activities shared by the MAo team. Each update is available in English and Kiswahili.',
      contactPageLead: 'Get in touch through our official email or postal address. We welcome conversations about agriculture, learning and partnership.',
      readUpdate: 'Read update', emailUs: 'Email MAo', visitWebsite: 'Visit our website', constitutionNote: 'Our organizational goals are described in the first edition of the MAo constitution (2024).',
      contactSocialTitle: 'Connect with MAo', contactSocialBody: 'Follow our channels for news and updates.', noPhoneNote: 'Please use the official email for enquiries.',
      navDonate: 'Donate', donatePageTitle: 'Donate | MAo', donatePageMeta: 'Support Mkulima Agricultural Organization with a direct bank transfer.',
      donateLabel: 'Support MAo', donateTitle: 'Help grow opportunity',
      donateLead: 'Your contribution helps MAo work toward its mission of expanding knowledge and opportunity in sustainable agriculture.',
      donateMethodLabel: 'Bank transfer', donateMethodTitle: 'Make a donation',
      donateMethodBody: 'Use the CRDB Bank details below to transfer directly to Mkulima Agricultural Organization.',
      donateBankType: 'Bank account', donateAccountNameLabel: 'Account name', donateAccountNumberLabel: 'Account number',
      donateContactLead: 'Questions about making a donation?'
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
      updatesIntro: 'Habari na shughuli zinazoshirikishwa na timu ya MAo.',
      updatesFirstTag: 'Taarifa ya MAo', updatesFirstTitle: 'Waanzilishi wajadili kilimo himilivu',
      updatesFirstBody: 'Katika kikao cha ndani, waanzilishi wa MAo walijadili namna ya kuwasaidia wananchi kupitia kilimo himilivu na kukabiliana na mabadiliko ya tabianchi.',
      updatesFirstAlt: 'Waanzilishi wa MAo wakiwa wameketi kuzunguka meza katika kikao cha ndani',
      contactLabel: 'Wasiliana nasi', contactTitle: 'Tushirikiane kuendeleza kilimo',
      contactBody: 'Wasiliana na MAo kupitia barua pepe rasmi na anuani ya posta hapa chini.',
      contactEmailLabel: 'Barua pepe', contactPostLabel: 'Sanduku la posta',
      contactEmailGeneral: 'Maswali ya jumla', contactEmailSupport: 'Msaada', contactEmailDonations: 'Michango', contactEmailBen: 'Ben', contactEmailExisting: 'Barua pepe ya awali',
      contactLocation: 'Uyole · Wilaya ya Mbeya · Tanzania', socialMedia: 'Mitandao ya kijamii', footerFollow: 'Tufuatilie', footerRights: 'Haki zote zimehifadhiwa.',
      homeLabel: 'Mwanzo', aboutPageTitle: 'Kuhusu sisi | MAo', focusPageTitle: 'Tunacholenga | MAo', updatesPageTitle: 'Taarifa | MAo', contactPageTitle: 'Wasiliana nasi | MAo',
      aboutStoryTitle: 'Sisi ni nani', aboutPrinciplesTitle: 'Misingi inayotuongoza', focusAreasTitle: 'Maeneo yetu sita ya kazi',
      latestUpdatesTitle: 'Taarifa za hivi karibuni', contactDetailsTitle: 'Njia za kuwasiliana nasi',
      aboutPageMeta: 'Fahamu Mkulima Agricultural Organization, dhamira, dira na asili yake Mbeya, Tanzania.',
      focusPageMeta: 'Fahamu malengo ya MAo kuhusu mafunzo, kilimo endelevu, uongezaji wa thamani na masoko.',
      updatesPageMeta: 'Soma habari na taarifa za Mkulima Agricultural Organization kwa Kiingereza na Kiswahili.',
      contactPageMeta: 'Wasiliana na Mkulima Agricultural Organization iliyopo Uyole, Mbeya, Tanzania.',
      aboutPageLead: 'MAo yenye makao yake Mbeya inalenga kujenga mustakabali ambapo wanawake na vijana wanaweza kujipatia riziki kupitia kilimo endelevu.',
      aboutPageStory: 'Katiba yetu inaeleza changamoto tunazotaka kushughulikia na jamii tunazokusudia kuzihudumia. Kadiri shughuli zinavyoendelea, tutashiriki taarifa na matokeo yaliyothibitishwa hapa.',
      focusPageLead: 'Katiba yetu inaainisha maeneo sita yanayohusiana. Haya ni malengo ya shirika, na tutayaongeza taarifa za miradi iliyothibitishwa zitakapopatikana.',
      updatesPageLead: 'Habari na shughuli zinazoshirikishwa na timu ya MAo. Kila taarifa inapatikana kwa Kiingereza na Kiswahili.',
      contactPageLead: 'Wasiliana nasi kupitia barua pepe rasmi au anuani ya posta. Tunakaribisha mazungumzo kuhusu kilimo, elimu na ushirikiano.',
      readUpdate: 'Soma taarifa', emailUs: 'Tuma barua pepe', visitWebsite: 'Tembelea tovuti', constitutionNote: 'Malengo ya shirika yameainishwa katika toleo la kwanza la Katiba ya MAo (2024).',
      contactSocialTitle: 'Ungana na MAo', contactSocialBody: 'Tufuatilie kwenye mitandao kwa habari na taarifa.', noPhoneNote: 'Tumia barua pepe rasmi kwa maulizo.',
      navDonate: 'Changia', donatePageTitle: 'Changia | MAo', donatePageMeta: 'Saidia Mkulima Agricultural Organization kwa kufanya uhamisho wa benki wa moja kwa moja.',
      donateLabel: 'Saidia MAo', donateTitle: 'Saidia kukuza fursa',
      donateLead: 'Mchango wako unasaidia MAo kufuatilia dhamira yake ya kupanua maarifa na fursa katika kilimo endelevu.',
      donateMethodLabel: 'Uhamisho wa benki', donateMethodTitle: 'Toa mchango',
      donateMethodBody: 'Tumia taarifa za CRDB Bank hapa chini kutuma mchango moja kwa moja kwa Mkulima Agricultural Organization.',
      donateBankType: 'Akaunti ya benki', donateAccountNameLabel: 'Jina la akaunti', donateAccountNumberLabel: 'Namba ya akaunti',
      donateContactLead: 'Una swali kuhusu kutoa mchango?'
    }
  };

  const picker = document.getElementById('language-select');
  const control = picker?.closest('.mao-language-control');
  const dropdown = document.getElementById('mao-language-menu');
  const options = dropdown ? Array.from(dropdown.querySelectorAll('[data-language]')) : [];
  const menuButton = document.querySelector('.nav__toggle');
  const copyrightYear = document.getElementById('copyright-year');
  if (copyrightYear) copyrightYear.textContent = String(new Date().getFullYear());
  if (!picker || !control || !dropdown || options.length !== 2) return;

  let currentLanguage = 'en';

  function applyLanguage(language) {
    const locale = messages[language] ? language : 'en';
    const copy = messages[locale];
    currentLanguage = locale;
    document.documentElement.lang = locale;
    picker.querySelector('.mao-language-value').textContent = locale === 'sw' ? 'Kiswahili' : 'English';
    options.forEach((option) => option.setAttribute('aria-pressed', String(option.dataset.language === locale)));
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.content = copy[meta.dataset.i18nMeta] || copy.metaDescription;
    const pageTitle = document.querySelector('title[data-i18n-title]');
    if (pageTitle) pageTitle.textContent = copy[pageTitle.dataset.i18nTitle] || pageTitle.textContent;
    document.querySelectorAll('[data-i18n]').forEach((element) => {
      const value = copy[element.dataset.i18n];
      if (value !== undefined) element.textContent = value;
    });
    document.querySelectorAll('[data-i18n-aria]').forEach((element) => {
      const value = copy[element.dataset.i18nAria];
      if (value !== undefined) element.setAttribute('aria-label', value);
    });
    document.querySelectorAll('[data-i18n-alt]').forEach((element) => {
      const value = copy[element.dataset.i18nAlt];
      if (value !== undefined) element.setAttribute('alt', value);
    });
    if (menuButton) {
      menuButton.setAttribute('aria-label', copy[menuButton.getAttribute('aria-expanded') === 'true' ? 'closeMenu' : 'openMenu']);
    }
    window.dispatchEvent(new CustomEvent('mao:language-change', { detail: { language: locale } }));
  }

  function closeDropdown(returnFocus = false) {
    dropdown.hidden = true;
    picker.setAttribute('aria-expanded', 'false');
    if (returnFocus) picker.focus();
  }

  function openDropdown(preferredIndex) {
    dropdown.hidden = false;
    picker.setAttribute('aria-expanded', 'true');
    const selected = options.findIndex((option) => option.dataset.language === currentLanguage);
    options[preferredIndex === undefined ? Math.max(0, selected) : preferredIndex].focus();
  }

  function changeLanguage(language) {
    applyLanguage(language);
    try { localStorage.setItem('mao-language', currentLanguage); }
    catch (_) { /* The language switch still works when storage is blocked. */ }
    closeDropdown(true);
  }

  let savedLanguage = 'en';
  try { savedLanguage = localStorage.getItem('mao-language') || 'en'; }
  catch (_) { /* The language switch still works if storage is unavailable. */ }
  applyLanguage(savedLanguage);

  picker.addEventListener('click', () => {
    if (dropdown.hidden) openDropdown();
    else closeDropdown();
  });
  picker.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (dropdown.hidden) openDropdown(event.key === 'ArrowDown' ? 0 : options.length - 1);
      else options[event.key === 'ArrowDown' ? 0 : options.length - 1].focus();
    } else if (event.key === 'Escape' && !dropdown.hidden) {
      event.preventDefault();
      closeDropdown(true);
    }
  });
  options.forEach((option, index) => {
    option.addEventListener('click', () => changeLanguage(option.dataset.language));
    option.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeDropdown(true);
      } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        options[(index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length].focus();
      } else if (event.key === 'Home' || event.key === 'End') {
        event.preventDefault();
        options[event.key === 'Home' ? 0 : options.length - 1].focus();
      } else if (event.key === 'Tab') {
        closeDropdown();
      }
    });
  });
  document.addEventListener('click', (event) => {
    if (!dropdown.hidden && !control.contains(event.target)) closeDropdown();
  });
  window.addEventListener('scroll', () => {
    if (!dropdown.hidden) closeDropdown();
  }, { passive: true });

  if (menuButton) {
    menuButton.addEventListener('click', () => {
      closeDropdown();
      const copy = messages[currentLanguage];
      menuButton.setAttribute('aria-label', copy[menuButton.getAttribute('aria-expanded') === 'true' ? 'closeMenu' : 'openMenu']);
    });
  }
})();
