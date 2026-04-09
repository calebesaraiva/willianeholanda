import heroOfficeImage from '../assets/hero-office.jpg';
import aboutPortraitImage from '../assets/about-portrait.jpg';
import galleryOfficeImage from '../assets/gallery-office.jpg';
import gallerySurgeryImage from '../assets/gallery-surgery.jpg';
import galleryCertificateImage from '../assets/gallery-certificate.jpg';
import galleryOutdoorImage from '../assets/gallery-outdoor.jpg';
import galleryLifestyleImage from '../assets/gallery-lifestyle.jpg';
import galleryStaircaseImage from '../assets/gallery-staircase.jpg';

const whatsappUrl = 'https://wa.me/559992206647';

export const defaultSiteContent = {
  global: {
    whatsappUrl,
    whatsappMessage: 'Olá, Dra. Williane! Gostaria de falar com a equipe pelo WhatsApp.',
    instagramUrl: 'https://www.instagram.com/willianeholanda/',
    instagramHandle: '@willianeholanda',
    phone: '(99) 9 9220-6647',
    location: 'Imperatriz (MA) - Novo Repartimento (PA)',
    attendance: 'Seg. a Sex. | 8h às 18h',
    crm: 'CRM - MA 8393 | RQE 4113',
  },
  navbar: {
    brandAccent: 'Dra.',
    brandName: 'Williane Holanda',
    ctaLabel: 'Contato',
  },
  hero: {
    label: 'Médica Cirurgia Geral • CRM - MA 8393 | RQE 4113',
    titlePrimary: 'Dra. Williane',
    titleAccent: 'Holanda',
    tagline:
      'Blefaroplastia, lifting de supercílio, lipo de papada e platismoplastia com condução segura, olhar refinado e cuidado atento em cada detalhe da experiência cirúrgica.',
    primaryCta: 'Falar no WhatsApp',
    secondaryCta: 'Conheça a Doutora',
    backgroundImage: heroOfficeImage,
    stats: [
      { number: '01', label: 'Blefaroplastia' },
      { number: '02', label: 'Lifting de Supercílio' },
      { number: '03', label: 'Lipo de Papada' },
      { number: '04', label: 'Platismoplastia' },
    ],
  },
  about: {
    sectionLabel: '01 - Sobre',
    titlePrefix: 'Cirurgia com',
    titleAccent: 'elegância e precisão',
    paragraphs: [
      'A Dra. Williane Holanda construiu sua trajetória com base em critério técnico, sensibilidade humana e responsabilidade em cada decisão cirúrgica. Sua presença transmite segurança, clareza e cuidado desde o primeiro contato.',
      'Cada paciente é conduzido com avaliação individualizada, planejamento cuidadoso e acompanhamento próximo. Mais do que executar uma técnica, sua proposta é entregar confiança, leveza e um atendimento à altura da expectativa de quem busca refinamento e seriedade.',
    ],
    credentials: [
      'Medicina ITPAC-PORTO',
      'Cirurgiã Geral',
      'CRM - MA 8393 | RQE 4113',
      'Imperatriz (MA) - Novo Repartimento (PA)',
    ],
    image: aboutPortraitImage,
    badgeTitle: 'Atuação Especializada',
    badgeSubtitle: 'Blefaroplastia | Lifting de supercílio | Lipo de Papada | Platismoplastia',
  },
  specialties: {
    sectionLabel: '02 - Especialidades',
    headingPrefix: 'Procedimentos com',
    headingAccent: 'assinatura própria',
    items: [
      {
        number: '01',
        title: 'Blefaroplastia',
        desc: 'Um olhar mais leve, descansado e elegante, com planejamento cuidadoso para preservar naturalidade e harmonia facial.',
      },
      {
        number: '02',
        title: 'Lifting de Supercílio',
        desc: 'Elevação sutil e elegante do olhar, com foco em harmonia facial, naturalidade e refinamento do contorno superior.',
      },
      {
        number: '03',
        title: 'Lipo de Papada',
        desc: 'Definição mais limpa do contorno facial com abordagem precisa, delicada e pensada para valorizar proporção e sutileza.',
      },
      {
        number: '04',
        title: 'Platismoplastia',
        desc: 'Refinamento cervical com foco em firmeza, continuidade do perfil e resultado visual sofisticado.',
      },
      {
        number: '05',
        title: 'Avaliação Individualizada',
        desc: 'Cada indicação é analisada com critério para alinhar anatomia, expectativa, técnica e recuperação.',
      },
      {
        number: '06',
        title: 'Planejamento Cirúrgico',
        desc: 'A experiência começa antes do procedimento, com orientação clara, preparo cuidadoso e condução responsável.',
      },
      {
        number: '07',
        title: 'Pós-operatório Próximo',
        desc: 'Acompanhamento atento para que recuperação, segurança e tranquilidade caminhem juntas em todo o processo.',
      },
    ],
  },
  journey: {
    sectionLabel: '03 - Trajetória',
    headingPrefix: 'Uma história de',
    headingAccent: 'dedicação',
    items: [
      {
        year: '2009',
        title: 'Início da Formação',
        desc: 'Ingresso na Medicina com foco em estudo, disciplina e construção de uma base clínica sólida.',
      },
      {
        year: '2015',
        title: 'Formação Médica',
        desc: 'Conclusão da graduação e consolidação do compromisso com uma medicina técnica e humana.',
      },
      {
        year: '2021',
        title: 'Residência Médica',
        desc: 'Aprofundamento em Cirurgia Geral, com amadurecimento técnico e vivência hospitalar intensa.',
      },
      {
        year: '2023',
        title: 'Aperfeiçoamento Contínuo',
        desc: 'Atualização constante para unir técnica, segurança e refinamento na prática diária.',
      },
      {
        year: 'Hoje',
        title: 'Referência em Imperatriz',
        desc: 'Atuação com identidade própria, cuidado individualizado e uma imagem profissional sólida na região.',
      },
    ],
  },
  gallery: {
    sectionLabel: 'Galeria',
    headingPrefix: 'Presença profissional em',
    headingAccent: 'imagens reais',
    buttonLabel: 'Ver Instagram',
    items: [
      {
        src: galleryOfficeImage,
        caption: 'Consultório com presença, critério e acolhimento',
        alt: 'Dra. Williane em atendimento',
      },
      {
        src: galleryStaircaseImage,
        caption: 'Imagem institucional com elegância e autoridade',
        alt: 'Retrato da Dra. Williane',
      },
      {
        src: gallerySurgeryImage,
        caption: 'Rotina cirúrgica conduzida com foco e precisão',
        alt: 'Dra. Williane em procedimento cirúrgico',
      },
      {
        src: galleryCertificateImage,
        caption: 'Atualização constante e compromisso com excelência',
        alt: 'Dra. Williane com certificado',
      },
      {
        src: galleryOutdoorImage,
        caption: 'Leveza e proximidade como extensão do cuidado',
        alt: 'Dra. Williane em ambiente externo',
      },
      {
        src: galleryLifestyleImage,
        caption: 'Humanidade e presença para além do consultório',
        alt: 'Dra. Williane em momento casual',
      },
    ],
  },
  testimonials: {
    sectionLabel: '04 - Depoimentos',
    items: [
      {
        text: 'A Dra. Williane me transmitiu muita segurança. Tudo foi explicado com clareza, e o atendimento foi extremamente cuidadoso do início ao fim.',
        name: 'Carlos Eduardo M.',
        procedure: 'Blefaroplastia',
        stars: 5,
      },
      {
        text: 'Profissional delicada, atenciosa e muito segura no que faz. Me senti acolhida e confiante em todas as etapas.',
        name: 'Ana Paula S.',
        procedure: 'Lipo de Papada',
        stars: 5,
      },
      {
        text: 'O que mais me marcou foi a postura serena e o cuidado com cada detalhe. Passa muita confiança e credibilidade.',
        name: 'Roberto Lima',
        procedure: 'Platismoplastia',
        stars: 5,
      },
      {
        text: 'Foi uma experiência muito tranquila. Atendimento humano, explicações objetivas e uma condução extremamente profissional.',
        name: 'Fernanda Costa',
        procedure: 'Avaliação Cirúrgica',
        stars: 5,
      },
    ],
  },
  contact: {
    sectionLabel: '05 - Contato',
    titlePrefix: 'Vamos conversar',
    titleAccent: 'com a equipe',
    description:
      'O primeiro contato acontece diretamente pelo WhatsApp para que a equipe possa orientar, acolher e organizar cada atendimento com agilidade.',
    cards: [
      { label: 'WhatsApp', value: '(99) 9 9220-6647', type: 'whatsapp' },
      { label: 'Instagram', value: '@willianeholanda', type: 'instagram' },
      { label: 'Localização', value: 'Imperatriz (MA) - Novo Repartimento (PA)', type: 'static' },
      { label: 'Atendimento', value: 'Seg. a Sex. | 8h às 18h', type: 'static' },
    ],
    panelTitle: 'Atendimento direto e organizado',
    panelBody:
      'Para tirar dúvidas, receber orientação inicial e alinhar o atendimento, a equipe responde diretamente pelo WhatsApp com um fluxo mais ágil e bem acompanhado.',
    panelBullets: [
      'Contato inicial e acolhimento pelo WhatsApp',
      'Triagem e organização com a equipe',
      'Agendamentos respeitando as datas liberadas pela Dra.',
    ],
    buttonLabel: 'Falar no WhatsApp',
  },
  footer: {
    brandDescription:
      'Cirurgia Geral com seriedade, sensibilidade e um olhar atento para segurança, refinamento e confiança.',
    contactItems: [
      'Imperatriz (MA) - Novo Repartimento (PA)',
      '(99) 9 9220-6647',
      '@willianeholanda',
      'CRM - MA 8393 | RQE 4113',
    ],
    copyrightPrefix: '(c)',
    copyrightSuffix: 'Dra. Williane Holanda - Todos os direitos reservados',
    tagline: 'Cirurgia com elegância e precisão',
  },
  admin: {
    availableDates: [],
    availableTimeSlots: {},
    appointments: [],
  },
};
