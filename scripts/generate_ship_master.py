"""
艦娘マスタデータ生成スクリプト (Phase 0)

データソース: kcwiki/kancolle-data (https://github.com/kcwiki/kancolle-data)
  - api/api_start2.json: 艦これ公式クライアントAPIの生マスタデータのミラー
    (api_mst_ship: 艦娘マスタ, api_mst_stype: 艦種マスタ)
  - 有志コミュニティ(kcwiki)が継続的に更新しているオープンデータ。
    画像・イラスト等の著作物は一切含まれず、名称・数値等のテキスト情報のみを扱う。

処理内容:
  1. api_mst_ship から「自己紹介ボイス(api_getmes)を持つ」艦のみを抽出し、
     深海棲艦(敵)を除外する。
  2. api_aftershipid (改装先ID) を辿り、艦娘ごとの改装形態チェーンを復元する。
     チェーンの起点(誰からも改装先として参照されない艦)を「艦娘マスタの1エントリ」とする。
  3. 各改装形態の名称は、起点艦の名前との文字列差分から改装ラベル(例: "改" "改二" "改二丙")を算出する。
     改装形態ごとに艦種(api_stype)も個別に保持する(改装で艦種が変わる艦に対応するため)。
  4. 艦級(姉妹艦グループ)は api_ctype でグルーピングし、
     グループ内で api_sort_id が最小の艦(=艦級名の由来艦)の名前 + "型" を艦級名とする。
     (sortno は図鑑掲載順で艦級と無関係にばらつくため使用しない。sort_id はほぼ艦級順に整列している)

再実行方法:
  1. https://raw.githubusercontent.com/kcwiki/kancolle-data/master/api/api_start2.json
     をダウンロードし、このスクリプトと同じディレクトリに api_start2.json として保存
  2. `python scripts/generate_ship_master.py` を実行
  3. data/shipMaster.json が更新される

注意:
  - 改装が単純な直線チェーンではない一部の艦(分岐改装等)は、代表的な1系統のみ収録される
    可能性がある。新艦娘・改装形態の追加/修正は艦娘マスタ管理画面(メンテナンス画面)から
    手動で行う前提。
"""

import json
import os
from collections import defaultdict

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SOURCE_PATH = os.path.join(SCRIPT_DIR, "api_start2.json")
OUTPUT_PATH = os.path.join(SCRIPT_DIR, "..", "src", "data", "shipMaster.json")


def load_source():
    with open(SOURCE_PATH, encoding="utf-8") as f:
        return json.load(f)


def parse_aftershipid(ship):
    v = ship.get("api_aftershipid")
    if v in (None, "", "0", "-1"):
        return None
    try:
        iv = int(v)
    except (TypeError, ValueError):
        return None
    return iv if iv > 0 else None


def main():
    raw = load_source()
    ships_raw = raw["api_mst_ship"]
    stypes_raw = raw["api_mst_stype"]

    stype_names = {s["api_id"]: s["api_name"] for s in stypes_raw}

    # 深海棲艦を除外: プレイアブル艦は自己紹介ボイス(api_getmes)を持つ
    playable = {s["api_id"]: s for s in ships_raw if "api_getmes" in s}

    targeted_ids = set()
    for s in playable.values():
        t = parse_aftershipid(s)
        if t is not None:
            targeted_ids.add(t)

    # 起点艦 = 他艦の改装先として参照されていない艦
    roots = [s for id_, s in playable.items() if id_ not in targeted_ids]
    roots.sort(key=lambda s: (s.get("api_sort_id") or 999999999, s["api_id"]))

    def build_chain(start):
        chain = []
        visited = set()
        cur = start
        while cur is not None and cur["api_id"] not in visited:
            visited.add(cur["api_id"])
            chain.append(cur)
            nxt_id = parse_aftershipid(cur)
            cur = playable.get(nxt_id) if nxt_id else None
        return chain

    def make_entry(root, chain):
        base_name = root["api_name"]
        refit_forms = []
        used_labels = {}
        for idx, s in enumerate(chain):
            suffix = None
            if s["api_name"].startswith(base_name):
                suffix = s["api_name"][len(base_name):]
            if idx == 0:
                label = "無印"
            elif suffix:
                label = suffix
            else:
                # 史実の艦艇引き渡し等により改装形態名が艦名そのものになるケース
                # (例: 雪風改二丙"丹陽", Littorio→Italia, U-511→呂500)。
                # その艦自身の実際の名前をそのままラベルとして採用する。
                label = s["api_name"]
            if label in used_labels:
                used_labels[label] += 1
                label = f"{label} ({used_labels[label]})"
            else:
                used_labels[label] = 1
            refit_forms.append(
                {
                    "id": str(s["api_id"]),
                    "name": label,
                    # 一部艦は改装により艦種が変わる(例: 千歳 水上機母艦→軽空母、
                    # 大鯨→龍鳳 潜水母艦→軽空母)ため、改装形態ごとに艦種を保持する。
                    "shipType": stype_names.get(s["api_stype"], ""),
                }
            )
        return {
            "id": str(root["api_id"]),
            "name": base_name,
            "shipType": stype_names.get(root["api_stype"], ""),
            "ctype": root.get("api_ctype"),
            "sortId": root.get("api_sort_id") or 999999999,
            "refitForms": refit_forms,
        }

    ship_entries = []
    covered_ids = set()
    for root in roots:
        chain = build_chain(root)
        covered_ids.update(s["api_id"] for s in chain)
        ship_entries.append(make_entry(root, chain))

    # 改装チェーンが循環参照になっている艦(例: 宗谷)は起点が存在しないため、
    # 上記のロジックでは拾えない。未収録IDが残っていれば、そのグループ内で
    # api_sort_id が最小の艦を疑似的な起点として扱う。
    leftover_ids = set(playable.keys()) - covered_ids
    while leftover_ids:
        pseudo_root = min(
            (playable[i] for i in leftover_ids),
            key=lambda s: (s.get("api_sort_id") or 999999999, s["api_id"]),
        )
        chain = build_chain(pseudo_root)
        covered_ids.update(s["api_id"] for s in chain)
        leftover_ids -= {s["api_id"] for s in chain}
        ship_entries.append(make_entry(pseudo_root, chain))

    # 艦級(姉妹艦グループ)名の算出
    by_ctype = defaultdict(list)
    for e in ship_entries:
        by_ctype[e["ctype"]].append(e)

    for ctype, group in by_ctype.items():
        group.sort(key=lambda e: e["sortId"])
        lead_name = group[0]["name"]
        class_name = f"{lead_name}型"
        for e in group:
            e["shipClass"] = class_name

    ship_entries.sort(key=lambda e: e["sortId"])

    final = [
        {
            "id": e["id"],
            "name": e["name"],
            "shipType": e["shipType"],
            "shipClass": e["shipClass"],
            "refitForms": e["refitForms"],
        }
        for e in ship_entries
    ]

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(final, f, ensure_ascii=False, indent=2)

    total_forms = sum(len(e["refitForms"]) for e in final)
    print(f"艦娘マスタ生成完了: {len(final)}隻 / 改装形態合計{total_forms}件 -> {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
