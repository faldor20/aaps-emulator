import type { InputBindingApi, ListApi } from 'tweakpane'

import { Color, Vector3 } from 'three'
import { ButtonApi } from 'tweakpane'

/**
 * Adds a button that resets the value of an input to its default value when clicked.
 */
export function createResetButton(
	input: InputBindingApi<unknown, unknown> | ListApi<any> | ButtonApi,
	key: string,
	sourceObj: Record<string, any>,
	el?: HTMLElement,
	callback?: () => void,
) {
	if (!input) return

	const defaultButton = createDefaultButton()

	const targetValue = sourceObj[key] ?? sourceObj['defaults'][key]

	if (!exists(targetValue)) throw new Error(`Key "${String(key)}" not found in source object.`)

	//* We can simply overwrite numbers and booleans.
	if (typeof targetValue === 'number' || typeof targetValue === 'boolean') {
		const defaultValue = JSON.parse(JSON.stringify(targetValue))
		addReset(defaultValue)
	}

	//* Color instances will need to go through the setter.
	if (isColor(targetValue)) {
		const defaultColor = new Color().fromArray(targetValue.toArray())
		addReset(defaultColor)
	}

	//* Vectors are a bit more finicky.
	if (isVector3(targetValue)) {
		const defaultVector = new Vector3().copy(targetValue)

		if (typeof defaultVector === 'undefined') {
			console.error({ key, sourceObj })
			throw new Error(
				`createResetToDefaultButton() - Key "${String(key)}" not found in source object.`,
			)
		}

		addReset(defaultVector)
	}

	//* Check for lists.
	if ('options' in input) {
		const options = input.options

		if (options.length) {
			const defaultOption = options.find((option) => option.value === targetValue)

			if (defaultOption) {
				defaultButton.addEventListener('click', () => {
					sourceObj[key] = defaultOption.value

					// Update the select text - https://github.com/cocopon/tweakpane/issues/547
					const select = input.element.getElementsByTagName('select')?.[0]
					if (select) {
						const index = options.findIndex(
							(option) => option.value === defaultOption.value,
						)
						select.selectedIndex = index
					}

					reset(defaultOption)
					resetGui()
				})
			}
		}
	}

	//* Mount the button.
	const inputEl = el ?? input.element
	inputEl.appendChild(defaultButton)

	function addReset(value: any) {
		defaultButton.addEventListener('click', () => {
			reset(value)
			resetGui()
		})
	}

	function reset(value: any) {
		if (callback) {
			callback()
			resetGui()
		} else {
			sourceObj[key] = value
		}
	}

	function resetGui() {
		setTimeout(() => {
			defaultButton.style.color = '#333'
			if ('refresh' in input) input.refresh()
		}, 10)
	}

	function createDefaultButton() {
		const btn = document.createElement('div')

		btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12px" height="12px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-darkreader-inline-stroke="" style="--darkreader-inline-stroke:currentColor;"><path d="M3 2v6h6" /><path d="M21 12A9 9 0 0 0 6 5.3L3 8" /><path d="M21 22v-6h-6" /><path d="M3 12a9 9 0 0 0 15 6.7l3-2.7" /></svg>`
		btn.style.display = 'flex'
		btn.style.alignItems = 'center'
		btn.style.justifyContent = 'center'

		btn.style.width = '1rem'
		btn.style.height = '1rem'
		btn.style.margin = 'auto'

		btn.style.color = '#333'
		btn.style.cursor = 'pointer'

		btn.style.transform = 'translateX(0.1rem)'
		btn.style.userSelect = 'none'
		btn.title = 'Reset to default'

		if (input instanceof ButtonApi) {
			input.on('click', () => {
				btn.style.color = '#aaa'
			})
		} else {
			input.on('change', () => {
				btn.style.color = '#aaa'
			})
		}

		return btn
	}
}

function exists<T>(value: T | undefined): value is T {
	return typeof value !== 'undefined'
}

function isVector3(v: any): v is Vector3 {
	return typeof v === 'object' && 'isVector3' in v
}

function isColor(v: any): v is Color {
	return v instanceof Color
}