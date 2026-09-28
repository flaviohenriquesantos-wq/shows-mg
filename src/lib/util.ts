import type { Config, Municipio, MunicipioCalc } from '../types'

export function distanciaKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

export function porte(pop: number | null) {
  if (pop == null) return '—'
  if (pop < 5000) return 'Até 5 mil'
  if (pop < 10000) return '5–10 mil'
  if (pop < 20000) return '10–20 mil'
  if (pop < 50000) return '20–50 mil'
  if (pop < 100000) return '50–100 mil'
  return '100 mil+'
}
export const PORTES = ['Até 5 mil', '5–10 mil', '10–20 mil', '20–50 mil', '50–100 mil', '100 mil+']

export function calcular(lista: Municipio[], cfg: Config): MunicipioCalc[] {
  const base = lista.find((m) => String(m.id) === cfg.cidade_base) ?? lista[0]
  const fator = Number(cfg.fator_estrada) || 1.3
  const ra = Number(cfg.raio_a) || 150
  const rb = Number(cfg.raio_b) || 300
  return lista.map((m) => {
    const d = base ? Math.round(distanciaKm(base.latitude, base.longitude, m.latitude, m.longitude) * fator) : 0
    return { ...m, distancia: d, prioridade: d <= ra ? 'A' : d <= rb ? 'B' : 'C', porte: porte(m.populacao), ct_qtd: 0, ct_mediana: null, ct_maior: null, ct_ultima: null }
  })
}

export const normaliza = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export const fmtNum = (n: number | null | undefined) => (n == null ? '—' : n.toLocaleString('pt-BR'))
export const fmtBRL = (n: number | null | undefined) =>
  n == null ? '—' : n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

/** 'YYYY-MM-DD' -> 'dd/mm/aaaa' sem problemas de fuso */
export function fmtData(iso: string | null | undefined) {
  if (!iso) return '—'
  const [y, m, d] = iso.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}
export function fmtDataHora(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

export function hojeISO(offsetDias = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offsetDias)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/** Dias até o próximo aniversário (texto dd/mm). null se inválido. */
export function diasAteAniversario(ddmm: string | null) {
  if (!ddmm) return null
  const m = ddmm.match(/^(\d{1,2})\/(\d{1,2})/)
  if (!m) return null
  const dia = Number(m[1]), mes = Number(m[2]) - 1
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0)
  let alvo = new Date(hoje.getFullYear(), mes, dia)
  if (alvo < hoje) alvo = new Date(hoje.getFullYear() + 1, mes, dia)
  return Math.round((alvo.getTime() - hoje.getTime()) / 86400000)
}

export function soDigitos(s: string | null | undefined) {
  return (s ?? '').replace(/\D/g, '')
}
export function linkWhatsApp(numero: string, texto: string) {
  let n = soDigitos(numero)
  if (!n.startsWith('55')) n = '55' + n
  return `https://wa.me/${n}?text=${encodeURIComponent(texto)}`
}

export function preencher(modelo: string, vars: Record<string, string>) {
  return modelo.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '')
}

export function exportarCSV(nome: string, linhas: Record<string, unknown>[]) {
  if (!linhas.length) return
  const cols = Object.keys(linhas[0])
  const esc = (v: unknown) => {
    const s = v == null ? '' : String(v)
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const csv = '﻿' + [cols.join(';'), ...linhas.map((l) => cols.map((c) => esc(l[c])).join(';'))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = nome
  a.click()
  URL.revokeObjectURL(a.href)
}

export const STATUS_COR: Record<string, string> = {
  'A contatar': 'st-neutro',
  'Contato feito': 'st-azul',
  'Aguardando retorno': 'st-amarelo',
  'Proposta enviada': 'st-roxo',
  'Negociando': 'st-laranja',
  'Fechado': 'st-verde',
  'Sem interesse': 'st-cinza',
  'Retomar depois': 'st-bege',
}
