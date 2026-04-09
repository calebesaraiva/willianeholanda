# WhatsApp Setup

## Variaveis de ambiente

Preencha no servidor:

```env
PUBLIC_BASE_URL=https://seu-dominio-ou-ngrok
WHATSAPP_VERIFY_TOKEN=defina-um-token-seguro
WHATSAPP_ACCESS_TOKEN=cole-o-token-da-cloud-api
WHATSAPP_PHONE_NUMBER_ID=cole-o-phone-number-id
WHATSAPP_GRAPH_VERSION=v23.0
```

## Webhook

Configure no Meta WhatsApp Cloud API:

- Callback URL: `https://seu-dominio-ou-ngrok/api/whatsapp/webhook`
- Verify token: o mesmo valor de `WHATSAPP_VERIFY_TOKEN`

## Comandos aceitos no WhatsApp

### Ver datas liberadas

```text
DATAS
```

### Criar agendamento

```text
AGENDAR
NOME: Maria da Silva
CPF: 12345678901
ENDERECO: Rua Exemplo, 10
DATA: 2026-04-12
PROCEDIMENTO: Consulta
OBS: Opcional
```

### Consultar status

```text
STATUS
CPF: 12345678901
DATA: 2026-04-12
```

### Cancelar agendamento

```text
CANCELAR
CPF: 12345678901
DATA: 2026-04-12
```

## Testes

- Painel admin: secao `WhatsApp > Webhook e automacao`
- Simulacao local: cria e atualiza agendamentos sem depender da Meta
- Envio real: so fica habilitado quando `WHATSAPP_ACCESS_TOKEN` e `WHATSAPP_PHONE_NUMBER_ID` estiverem configurados
