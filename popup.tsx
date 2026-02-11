import { useEffect, useState } from "react"
import DeleteIcon from "@mui/icons-material/Delete"
import HistoryIcon from "@mui/icons-material/History"
import SettingsIcon from "@mui/icons-material/Settings"
import {
  Box,
  Button,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Modal,
  Slider,
  Stack,
  TextField,
  Tooltip,
  Typography
} from "@mui/material"
import { useStorage } from "@plasmohq/storage/hook"

let selection = ""

// Get selected text in active tab
function getTextSelection(): string {
  return window.getSelection()?.toString() ?? ""
}

export default function IndexPopup(): JSX.Element {
  const [openHistory, setOpenHistory] = useState(false)
  const [prompt, setPrompt] = useState("")
  const [buttonText, setButtonText] = useState("Generate (Ctrl+Enter)")
  const [result, setResult] = useState("")
  const [error, setError] = useState("")

  const [temperature, setTemperature] = useStorage("openai_temperature", async (v) =>
    v === undefined ? 0.0 : v
  )
  const [history, setHistory] = useStorage("openai_history", async (v) => (v ?? []))
  const [key] = useStorage("openai_key")
  const [maxTokens] = useStorage("openai_max_tokens", async (v) => v ?? 150)
  const [model] = useStorage("openai_model", async (v) => v ?? "text-davinci-003")

  // Get selection from active tab once
  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0]
      if (!tab?.id) return
      chrome.scripting.executeScript(
        { target: { tabId: tab.id, allFrames: true }, func: getTextSelection },
        (injectionResults) => {
          for (const r of injectionResults) {
            if (r.result && r.result !== selection) {
              selection = r.result as string
              setPrompt("{SELECTION}")
            }
          }
        }
      )
    })
  }, [])

  // Generate prompt using OpenAI API
  const createCompletion = async () => {
    if (!key) {
      setError("API key not set in options!")
      return
    }

    const params = {
      prompt: prompt.replaceAll("{SELECTION}", selection),
      temperature,
      max_tokens: maxTokens,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      model
    }

    setButtonText("Generating...")

    try {
      const res = await fetch("https://api.openai.com/v1/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify(params)
      })

      const data = await res.json()

      if (data.error) {
        setError(data.error.message ?? "Unknown API error")
        setButtonText("Generate (Ctrl+Enter)")
        return
      }

      const filteredText = (data.choices?.[0]?.text ?? "")
        .split(/\r?\n/)
        .filter((line: string) => line.trim())
        .join("\n")

      setResult(filteredText)

      const newHistory = [filteredText, ...history]
      setHistory(newHistory)
    } catch (err: any) {
      setError(err.message ?? "Failed to generate text")
    } finally {
      setButtonText("Generate (Ctrl+Enter)")
    }
  }

  const handleTemperatureChange = (_: Event, value: number | number[]) => {
    setTemperature(value as number)
  }

  return (
    <Stack direction="column" minWidth={550} spacing={2}>
      {/* Error modal */}
      <Modal open={!!error} onClose={() => setError("")}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 300,
            bgcolor: "background.paper",
            border: "2px solid #000",
            boxShadow: 24,
            p: 4
          }}>
          <Typography variant="h6">Error</Typography>
          <Typography>{error}</Typography>
        </Box>
      </Modal>

      {/* History modal */}
      <Modal open={openHistory} onClose={() => setOpenHistory(false)}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 500,
            bgcolor: "background.paper",
            border: "2px solid #000",
            boxShadow: 24,
            p: 4
          }}>
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="h6">History</Typography>
            <IconButton onClick={() => setHistory([])}>
              <Tooltip title="Clear history">
                <DeleteIcon />
              </Tooltip>
            </IconButton>
          </Stack>
          <Divider />
          <Box sx={{ overflowY: "auto", height: 400 }}>
            <List>
              {history.length ? (
                history.map((item, index) => (
                  <ListItemButton
                    key={index}
                    onClick={() => {
                      setPrompt(item)
                      setOpenHistory(false)
                    }}>
                    <ListItemText primary={`${index + 1}. ${item}`} />
                  </ListItemButton>
                ))
              ) : (
                <ListItemButton>
                  <ListItemText primary="<empty>" />
                </ListItemButton>
              )}
            </List>
          </Box>
        </Box>
      </Modal>

      <Stack direction="row" justifyContent="space-between">
        <Typography variant="h5">AI Companion</Typography>
        <Stack direction="row" spacing={1}>
          <Tooltip title="History">
            <IconButton onClick={() => setOpenHistory(true)}>
              <HistoryIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Settings">
            <IconButton onClick={() => chrome.runtime.openOptionsPage()}>
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      <TextField
        label="Prompt"
        multiline
        minRows={2}
        autoFocus
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={(e) => {
          if (e.ctrlKey && e.key === "Enter") createCompletion()
          if (e.ctrlKey && e.key === "c") navigator.clipboard.writeText(result)
        }}
      />

      <TextField
        label={selection ? "Selected Text {SELECTION}" : "Selected Text (None)"}
        multiline
        minRows={1}
        InputProps={{ readOnly: true }}
        value={selection}
      />

      <Stack direction="row" spacing={2} alignItems="center">
        <Typography variant="subtitle2">Temperature:</Typography>
        <Slider
          size="small"
          step={0.1}
          min={0}
          max={1}
          marks
          valueLabelDisplay="auto"
          value={temperature}
          onChange={handleTemperatureChange}
        />
      </Stack>

      <Button variant="contained" onClick={createCompletion}>
        {buttonText}
      </Button>

      <Divider />

      <TextField
        label="Result (Ctrl+C → Clipboard)"
        multiline
        minRows={7}
        InputProps={{ readOnly: true }}
        value={result}
      />

      <iframe src="up_/sandbox.html" id="sandbox" style={{ display: "none" }} />
    </Stack>
  )
}
