export default async function bps() {
	const postal_uri =
		"https://sig.bps.go.id/rest-bridging-pos/getwilayah?level=$LEVEL&parent=$PARENT";
	const uri =
		"https://sig.bps.go.id/rest-bridging/getwilayah?level=$LEVEL&parent=$PARENT";
	const MAP = ["provinsi", "kabupaten", "kecamatan", "desa"];

	async function get(parent = "0", level = "provinsi") {
		const response = await fetch(uri.replace("$LEVEL", level.toString()).replace("$PARENT", parent.toString()), {
			headers: { "Content-Type": "application/json" },
		});

		const body = await response.json();
		const result: Record<string, {
			parent: string,
			bps_code: string,
			dagri_code: string,
			text: string,
			postal_codes?: Array<string>
		}> = {}

		body.forEach((_: {
			kode_bps: string,
			nama_dagri: string,
			kode_dagri: string
		}) => {
			if (_.kode_bps != "") {
				result[_.kode_bps as string] = {
					parent: parent.toString(),
					bps_code: _.kode_bps,
					dagri_code: _.kode_dagri,
					text: _.nama_dagri,
					postal_codes: [],
				}
			}
		})

		const postal_response = await fetch(postal_uri.replace("$LEVEL", level.toString()).replace("$PARENT", parent.toString()), {
			headers: { "Content-Type": "application/json" },
		});

		const postal_body = await postal_response.json();

		postal_body.forEach((_: {
			kode_bps: string,
			kode_pos: string
		}) => {
			if (_.kode_bps != "" && result[_.kode_bps] != undefined) {
				result[_.kode_bps]?.postal_codes?.push(_.kode_pos)
			};
		})

		return result
	}

	let basepath = "data/"

	const p_result = await get()
	let filename = `province.json`
	await Bun.write([basepath, filename].join("/"), JSON.stringify(p_result));
	const KEYS = Object.keys(p_result)
	for (let j = 0; j < KEYS.length; j++) {
		const k_result = await get(KEYS[j], "kabupaten")
		await Bun.write([basepath, `${KEYS[j]}.json`].join("/"), JSON.stringify(k_result));
		const K_KEYS = Object.keys(k_result)
		for (let _j = 0; _j < K_KEYS.length; _j++) {
			const ke_result = await get(K_KEYS[_j], "kecamatan")
			await Bun.write([basepath, KEYS[j], `${K_KEYS[_j]}.json`].join("/"), JSON.stringify(ke_result));
			const KE_KEYS = Object.keys(ke_result)
			for (let __j = 0; __j < KE_KEYS.length; __j++) {
				const ke_result = await get(KE_KEYS[__j], "desa")
				await Bun.write([basepath, KEYS[j], K_KEYS[_j], `${KE_KEYS[__j]}.json`].join("/"), JSON.stringify(ke_result));
			}
		}
	}

	return;
}

