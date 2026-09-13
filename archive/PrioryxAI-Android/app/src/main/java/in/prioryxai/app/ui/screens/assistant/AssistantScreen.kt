package in.prioryxai.app.ui.screens.assistant

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowUpward
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import in.prioryxai.app.core.models.ChatMessage
import in.prioryxai.app.ui.theme.BrandViolet
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.util.UUID

data class AssistantUiState(
  val messages: List<ChatMessage> = listOf(
    ChatMessage(
      id = "1",
      role = "assistant",
      content = "Hello! I'm your PrioryxAI academic & career copilot. Ask me to prioritize tasks, analyze syllabus topics, suggest system design projects, or review your resume."
    )
  ),
  val inputText: String = "",
  val isLoading: Boolean = false
)

class AssistantViewModel : ViewModel() {
  private val _uiState = MutableStateFlow(AssistantUiState())
  val uiState: StateFlow<AssistantUiState> = _uiState.asStateFlow()

  fun setInputText(text: String) {
    _uiState.update { it.copy(inputText = text) }
  }

  fun sendMessage() {
    val prompt = _uiState.value.inputText.trim()
    if (prompt.isBlank()) return

    val userMsg = ChatMessage(id = UUID.randomUUID().toString(), role = "user", content = prompt)
    _uiState.update { it.copy(messages = it.messages + userMsg, inputText = "", isLoading = true) }

    viewModelScope.launch {
      delay(1000)
      val reply = "Here is your optimized action plan:\n\n1. **High Leverage Deliverables**: Complete your immediate Operating Systems lab task.\n2. **Targeted DSA**: Solve 2 LeetCode Mediums on Trees/Graphs.\n3. **Portfolio**: Push 1 clean commit to your Go Rate Limiter repository."
      val aiMsg = ChatMessage(id = UUID.randomUUID().toString(), role = "assistant", content = reply)
      _uiState.update { it.copy(messages = it.messages + aiMsg, isLoading = false) }
    }
  }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AssistantScreen(viewModel: AssistantViewModel = viewModel()) {
  val uiState by viewModel.uiState.collectAsStateWithLifecycle()
  val listState = rememberLazyListState()

  val suggestedPrompts = listOf(
    "⚡ Prioritize my pending assignments for this week",
    "📄 Review my resume for ATS flaws and backend gaps",
    "💻 What 3 LeetCode problems should I solve today?",
    "🔨 Recommend a system design project for 6th semester"
  )

  LaunchedEffect(uiState.messages.size) {
    if (uiState.messages.isNotEmpty()) {
      listState.animateScrollToItem(uiState.messages.size - 1)
    }
  }

  Scaffold(
    topBar = {
      TopAppBar(
        title = { Text("AI Copilot ✨", style = MaterialTheme.typography.titleMedium) },
        colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background)
      )
    },
    bottomBar = {
      Column(
        modifier = Modifier
          .fillMaxWidth()
          .background(MaterialTheme.colorScheme.surface)
          .navigationBarsPadding()
          .padding(horizontal = 16.dp, vertical = 8.dp)
      ) {
        if (uiState.messages.size <= 2) {
          LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.padding(bottom = 8.dp)) {
            items(suggestedPrompts) { prompt ->
              Box(
                modifier = Modifier
                  .clip(RoundedCornerShape(16.dp))
                  .background(MaterialTheme.colorScheme.surfaceVariant)
                  .clickable { viewModel.setInputText(prompt) }
                  .padding(horizontal = 12.dp, vertical = 6.dp)
              ) {
                Text(prompt, style = MaterialTheme.typography.labelSmall)
              }
            }
          }
        }

        Row(
          modifier = Modifier.fillMaxWidth(),
          verticalAlignment = Alignment.CenterVertically
        ) {
          OutlinedTextField(
            value = uiState.inputText,
            onValueChange = { viewModel.setInputText(it) },
            placeholder = { Text("Ask anything about syllabus, tasks, career...") },
            modifier = Modifier.weight(1f),
            shape = RoundedCornerShape(16.dp),
            maxLines = 3
          )

          Spacer(Modifier.width(8.dp))

          IconButton(
            onClick = { viewModel.sendMessage() },
            modifier = Modifier
              .size(44.dp)
              .clip(CircleShape)
              .background(if (uiState.inputText.isNotBlank()) BrandViolet else MaterialTheme.colorScheme.surfaceVariant)
          ) {
            Icon(Icons.Default.ArrowUpward, contentDescription = "Send", tint = Color.White)
          }
        }
      }
    }
  ) { padding ->
    LazyColumn(
      state = listState,
      modifier = Modifier
        .fillMaxSize()
        .background(MaterialTheme.colorScheme.background)
        .padding(padding)
        .padding(horizontal = 16.dp),
      verticalArrangement = Arrangement.spacedBy(12.dp),
      contentPadding = PaddingValues(vertical = 12.dp)
    ) {
      items(uiState.messages) { msg ->
        Row(
          modifier = Modifier.fillMaxWidth(),
          horizontalArrangement = if (msg.isUser) Arrangement.End else Arrangement.Start
        ) {
          if (!msg.isUser) {
            Box(
              modifier = Modifier
                .size(28.dp)
                .clip(RoundedCornerShape(8.dp))
                .background(BrandViolet.copy(alpha = 0.12f)),
              contentAlignment = Alignment.Center
            ) {
              Text("✨", fontSize = 14.sp)
            }
            Spacer(Modifier.width(8.dp))
          }

          Box(
            modifier = Modifier
              .widthIn(max = 280.dp)
              .clip(RoundedCornerShape(18.dp))
              .background(if (msg.isUser) BrandViolet else MaterialTheme.colorScheme.surfaceVariant)
              .padding(horizontal = 14.dp, vertical = 10.dp)
          ) {
            Text(
              text = msg.content,
              color = if (msg.isUser) Color.White else MaterialTheme.colorScheme.onSurface,
              style = MaterialTheme.typography.bodyMedium
            )
          }
        }
      }

      if (uiState.isLoading) {
        item {
          Text(
            "✨ Reasoning through your syllabus...",
            style = MaterialTheme.typography.labelSmall,
            color = BrandViolet
          )
        }
      }
    }
  }
}
