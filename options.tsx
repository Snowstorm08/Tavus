import { useCallback } from "react"

import {
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  Stack,
  TextField,
  Typography
} from "@mui/material"

import { useStorage } from "@plasmohq/storage/hook"

type OpenAIModel =
  | "gpt-4o-mini"
  | "gpt-4.1-mini"

export default function OptionsIndex() {
  const [apiKey, setApiKey] = useStorage<string>("openai_key", "")
  const [model, setModel] = useStorage<OpenAIModel>(
    "openai_model",
    "gpt-4o-mini"
  )
  const [maxTokens, setMaxTokens] = useStorage<number>(
    "openai_max_tokens",
    512
  )

  const handleMaxTokensChange = useCallback(
    (_: Event, value: number | number[]) => {
      setMaxTokens(value as number)
    },
    [setMaxTokens]
  )

  return (
    <Stack maxWidth={600} spacing={3}>
      <Typography variant="h5">
        OpenAI Extension Options
      </Typography>

      <Divider />

      <TextField
        label="OpenAI API Key"
        type="password"
        autoComplete="off"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value.trim())}
        helperText="Stored locally in browser storage"
        fullWidth
      />

      <FormControl fullWidth>
        <InputLabel id="model-select-label">Model</InputLabel>
        <Select
          labelId="model-select-label"
          label="Model"
          value={model}
          onChange={(e) => setModel(e.target.value as OpenAIModel)}
        >
          <MenuItem value="gpt-4o-mini">gpt-4o-mini (fast, cheap)</MenuItem>
          <MenuItem value="gpt-4.1-mini">gpt-4.1-mini (better reasoning)</MenuItem>
        </Select>
      </FormControl>

      <Stack spacing={1}>
        <Typography variant="subtitle2">
          Max tokens: {maxTokens}
        </Typography>
        <Slider
          step={64}
          min={128}
          max={4096}
          value={maxTokens}
          onChange={handleMaxTokensChange}
          valueLabelDisplay="auto"
        />
      </Stack>
    </Stack>
  )
}
