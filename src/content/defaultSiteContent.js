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
    whatsappMessage: 'Ola, Dra. Williane! Gostaria de falar com a equipe pelo WhatsApp.',
    instagramUrl: 'https://www.instagram.com/willianeholanda/',
    instagramHandle: '@willianeholanda',
    phone: '(99) 9 9220-6647',
    location: 'Imperatriz - Maranhao',
    attendance: 'Seg. a Sex. | 8h as 18h',
    crm: 'CRM - MA 8393 | RQE 4113',
  },
  navbar: {
    brandAccent: 'Dra.',
    brandName: 'Williane Holanda',
    ctaLabel: 'Contato',
  },
  hero: {
    label: 'Medica Cirurgia Geral • CRM - MA 8393 | RQE 4113',
    titlePrimary: 'Dra. Williane',
    titleAccent: 'Holanda',
    tagline:
      'Blefaroplastia, lifting de supercilio, lipo de papada e platismoplastia com conducao segura, olhar refinado e cuidado atento em cada detalhe da experiencia cirurgica.',
    primaryCta: 'Falar no WhatsApp',
    secondaryCta: 'Conheca a Doutora',
    backgroundImage: heroOfficeImage,
    stats: [
      { number: '01', label: 'Blefaroplastia' },
      { number: '02', label: 'Lifting de Supercilio' },
      { number: '03', label: 'Lipo de Papada' },
      { number: '04', label: 'Platismoplastia' },
    ],
  },
  about: {
    sectionLabel: '01 - Sobre',
    titlePrefix: 'Cirurgia com',
    titleAccent: 'elegancia e precisao',
    paragraphs: [
      'A Dra. Williane Holanda construiu sua trajetoria com base em criterio tecnico, sensibilidade humana e responsabilidade em cada decisao cirurgica. Sua presenca transmite seguranca, clareza e cuidado desde o primeiro contato.',
      'Cada paciente e conduzido com avaliacao individualizada, planejamento cuidadoso e acompanhamento proximo. Mais do que executar uma tecnica, sua proposta e entregar confianca, leveza e um atendimento a altura da expectativa de quem busca refinamento e seriedade.',
    ],
    credentials: [
      'Medicina ITPAC-PORTO',
      'Lifting de supercilio',
      'CRM - MA 8393 | RQE 4113',
      'Atuacao acrescenta Novo Repartimento - PA',
    ],
    image: aboutPortraitImage,
    badgeTitle: 'Atuacao Especializada',
    badgeSubtitle: 'Blefaroplastia | Lifting de supercilio | Lipo de Papada | Platismoplastia',
  },
  specialties: {
    sectionLabel: '02 - Especialidades',
    headingPrefix: 'Procedimentos com',
    headingAccent: 'assinatura propria',
    items: [
      {
        number: '01',
        title: 'Blefaroplastia',
        desc: 'Um olhar mais leve, descansado e elegante, com planejamento cuidadoso para preservar naturalidade e harmonia facial.',
      },
      {
        number: '02',
        title: 'Lifting de Supercilio',
        desc: 'Elevacao sutil e elegante do olhar, com foco em harmonia facial, naturalidade e refinamento do contorno superior.',
      },
      {
        number: '03',
        title: 'Lipo de Papada',
        desc: 'Definicao mais limpa do contorno facial com abordagem precisa, delicada e pensada para valorizar proporcao e sutileza.',
      },
      {
        number: '04',
        title: 'Platismoplastia',
        desc: 'Refinamento cervical com foco em firmeza, continuidade do perfil e resultado visual sofisticado.',
      },
      {
        number: '05',
        title: 'Avaliacao Individualizada',
        desc: 'Cada indicacao e analisada com criterio para alinhar anatomia, expectativa, tecnica e recuperacao.',
      },
      {
        number: '06',
        title: 'Planejamento Cirurgico',
        desc: 'A experiencia comeca antes do procedimento, com orientacao clara, preparo cuidadoso e conducao responsavel.',
      },
      {
        number: '07',
        title: 'Pos-operatorio Proximo',
        desc: 'Acompanhamento atento para que recuperacao, seguranca e tranquilidade caminhem juntas em todo o processo.',
      },
    ],
  },
  journey: {
    sectionLabel: '03 - Trajetoria',
    headingPrefix: 'Uma historia de',
    headingAccent: 'dedicacao',
    items: [
      {
        year: '2009',
        title: 'Inicio da Formacao',
        desc: 'Ingresso na Medicina com foco em estudo, disciplina e construcao de uma base clinica solida.',
      },
      {
        year: '2015',
        title: 'Formacao Medica',
        desc: 'Conclusao da graduacao e consolidacao do compromisso com uma medicina tecnica e humana.',
      },
      {
        year: '2021',
        title: 'Residencia Medica',
        desc: 'Aprofundamento em Cirurgia Geral, com amadurecimento tecnico e vivencia hospitalar intensa.',
      },
      {
        year: '2023',
        title: 'Aperfeicoamento Continuo',
        desc: 'Atualizacao constante para unir tecnica, seguranca e refinamento na pratica diaria.',
      },
      {
        year: 'Hoje',
        title: 'Referencia em Imperatriz',
        desc: 'Atuacao com identidade propria, cuidado individualizado e uma imagem profissional solida na regiao.',
      },
    ],
  },
  gallery: {
    sectionLabel: 'Galeria',
    headingPrefix: 'Presenca profissional em',
    headingAccent: 'imagens reais',
    buttonLabel: 'Ver Instagram',
    items: [
      {
        src: galleryOfficeImage,
        caption: 'Consultorio com presenca, criterio e acolhimento',
        alt: 'Dra. Williane em atendimento',
      },
      {
        src: galleryStaircaseImage,
        caption: 'Imagem institucional com elegancia e autoridade',
        alt: 'Retrato da Dra. Williane',
      },
      {
        src: gallerySurgeryImage,
        caption: 'Rotina cirurgica conduzida com foco e precisao',
        alt: 'Dra. Williane em procedimento cirurgico',
      },
      {
        src: galleryCertificateImage,
        caption: 'Atualizacao constante e compromisso com excelencia',
        alt: 'Dra. Williane com certificado',
      },
      {
        src: galleryOutdoorImage,
        caption: 'Leveza e proximidade como extensao do cuidado',
        alt: 'Dra. Williane em ambiente externo',
      },
      {
        src: galleryLifestyleImage,
        caption: 'Humanidade e presenca para alem do consultorio',
        alt: 'Dra. Williane em momento casual',
      },
    ],
  },
  testimonials: {
    sectionLabel: '04 - Depoimentos',
    items: [
      {
        text: 'A Dra. Williane me transmitiu muita seguranca. Tudo foi explicado com clareza, e o atendimento foi extremamente cuidadoso do inicio ao fim.',
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
        text: 'O que mais me marcou foi a postura serena e o cuidado com cada detalhe. Passa muita confianca e credibilidade.',
        name: 'Roberto Lima',
        procedure: 'Platismoplastia',
        stars: 5,
      },
      {
        text: 'Foi uma experiencia muito tranquila. Atendimento humano, explicacoes objetivas e uma conducao extremamente profissional.',
        name: 'Fernanda Costa',
        procedure: 'Avaliacao Cirurgica',
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
      { label: 'Localizacao', value: 'Imperatriz - Maranhao', type: 'static' },
      { label: 'Atendimento', value: 'Seg. a Sex. | 8h as 18h', type: 'static' },
    ],
    panelTitle: 'Atendimento direto e organizado',
    panelBody:
      'Para tirar duvidas, receber orientacao inicial e alinhar o atendimento, a equipe responde diretamente pelo WhatsApp com um fluxo mais agil e bem acompanhado.',
    panelBullets: [
      'Contato inicial e acolhimento pelo WhatsApp',
      'Triagem e organizacao com a equipe',
      'Agendamentos respeitando as datas liberadas pela Dra.',
    ],
    buttonLabel: 'Falar no WhatsApp',
  },
  footer: {
    brandDescription:
      'Cirurgia Geral com seriedade, sensibilidade e um olhar atento para seguranca, refinamento e confianca.',
    contactItems: [
      'Imperatriz - MA',
      '(99) 9 9220-6647',
      '@willianeholanda',
      'CRM - MA 8393 | RQE 4113',
    ],
    copyrightPrefix: '(c)',
    copyrightSuffix: 'Dra. Williane Holanda - Todos os direitos reservados',
    tagline: 'Cirurgia com elegancia e precisao',
  },
  admin: {
    availableDates: [],
    appointments: [],
  },
};
