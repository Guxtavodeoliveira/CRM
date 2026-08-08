@echo off
chcp 65001 >nul
title Shaliach - publicar atualizacao
cd /d "%~dp0"

echo.
echo  == Enviando alteracoes para o GitHub ==
echo.

git rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 (
  echo  ERRO: esta pasta ainda nao foi conectada ao GitHub.
  echo  Rode primeiro os comandos do arquivo COMO-PUBLICAR.md
  echo.
  pause
  exit /b
)

git add .

git diff --cached --quiet
if not errorlevel 1 (
  echo  Nada mudou desde o ultimo envio.
  echo.
  pause
  exit /b
)

set /p MSG="Descreva a mudanca (enter para 'atualizacao'): "
if "%MSG%"=="" set MSG=atualizacao

git commit -m "%MSG%"
git push

echo.
if errorlevel 1 (
  echo  Deu erro no envio. Confira a mensagem acima.
) else (
  echo  Pronto. O Cloudflare republica sozinho em cerca de 1 minuto.
)
echo.
pause
