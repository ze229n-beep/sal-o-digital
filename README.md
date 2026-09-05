# Salão Digital

Crie um site/painel administrativo moderno para uma barbearia, em português (Brasil), com backend Lovable Cloud/Supabase. Implemente todas as regras de salvamento explícito: em toda tela de edição, alterações ficam apenas no estado local e NUNCA salvam automaticamente; exiba claramente o botão “💾 SALVAR ALTERAÇÕES” ao haver mudanças, desabilitado durante envio com estado “Salvando...”, e mostre “✓ Alterações salvas com sucesso!” ou “⚠ Não foi possível salvar. Tente novamente.”. Serviços: criar listagem e formulários modernos no painel (sem prompt()) para editar nome, preço, duração, descrição, categoria/família e ativo/inativo, persistindo somente ao clicar salvar. Configurações da barbearia: formulário para nome, WhatsApp, Instagram, endereço, horários e texto da barbearia, também com salvar explícito. Segurança: alteração de senha em formulário próprio, botão separado “ALTERAR SENHA” e modal de confirmação antes de concluir. Implemente detecção de alterações não salvas em todas as telas de edição: ao navegar para outra rota/tela, modal “Você possui alterações não salvas. Deseja sair sem salvar?” com “Continuar editando” e “Sair sem salvar”; inclua proteção de recarregar/fechar a aba quando possível. Garanta prevenção contra clique duplicado e que dados em edição não sejam perdidos enquanto não forem salvos. Configure dados de exemplo e uma navegação clara para Serviços, Configurações e Segurança.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/529735ac-7bbc-4e03-9e92-b37d5f9d8a0e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
