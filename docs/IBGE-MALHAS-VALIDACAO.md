# Validação do arquivo baixado – BR_Municipios_2024.zip

**Data da verificação:** após extração em `data/ibge/`

---

## Origem

- **Arquivo:** `BR_Municipios_2024.zip` (Downloads)
- **Tamanho:** ~198 MB (208.153.231 bytes)
- **Extraído em:** `data/ibge/`

---

## Conteúdo extraído

| Arquivo | Descrição |
|---------|-----------|
| `BR_Municipios_2024.shp` | Geometria (polígonos dos municípios) |
| `BR_Municipios_2024.shx` | Índice do shapefile |
| `BR_Municipios_2024.dbf` | Atributos (CD_MUN, NM_MUN, SIGLA, AREA_KM2, etc.) |
| `BR_Municipios_2024.prj` | Projeção / sistema de referência |
| `BR_Municipios_2024.cpg` | Codepage (encoding) |

Conjunto completo para uso em GIS.

---

## Projeção

Arquivo `.prj`:

```
GEOGCS["GCS_SIRGAS_2000",DATUM["D_SIRGAS_2000",SPHEROID["GRS_1980",6378137.0,298.257222101]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]]
```

- **Sistema:** SIRGAS 2000 (esperado para malhas IBGE).
- **Unidades:** graus (coordenadas geográficas).

---

## Encoding

Arquivo `.cpg`: **UTF-8** — nomes de municípios com acento corretos.

---

## Conclusão

- Download e extração estão corretos.
- Shapefile completo (shp + shx + dbf + prj + cpg).
- Projeção SIRGAS 2000 e encoding UTF-8 conforme documentação do IBGE.

Para usar no sistema (ex.: mapa com limites), converta para GeoJSON com QGIS ou GDAL (`ogr2ogr -f GeoJSON br_municipios.json BR_Municipios_2024.shp`) ou importe em banco com PostGIS. A pasta `data/` está no `.gitignore` para não versionar arquivos grandes.
