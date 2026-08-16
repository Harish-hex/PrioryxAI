package in.prioryxai.app.ui.screens.learning

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.PlayCircle
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import in.prioryxai.app.ui.components.PXBadge
import in.prioryxai.app.ui.components.PXCard
import in.prioryxai.app.ui.theme.BrandViolet

data class VideoCardItem(
  val title: String,
  val channel: String,
  val duration: String,
  val category: String,
  val views: String,
  val url: String
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LearningScreen() {
  val context = LocalContext.current
  var selectedCategory by remember { mutableStateOf("All") }

  val categories = listOf("All", "DSA & LeetCode", "System Design", "Fullstack", "AI & ML", "Interview Prep")

  val videos = listOf(
    VideoCardItem(
      title = "Top 15 Dynamic Programming Patterns for FAANG",
      channel = "NeetCode",
      duration = "42:15",
      category = "DSA & LeetCode",
      views = "340K views",
      url = "https://www.youtube.com/watch?v=Hdr64lKQ3e4"
    ),
    VideoCardItem(
      title = "Design a Distributed Message Queue like Kafka",
      channel = "Gaurav Sen",
      duration = "28:40",
      category = "System Design",
      views = "520K views",
      url = "https://www.youtube.com/watch?v=kGZmsU7l870"
    ),
    VideoCardItem(
      title = "Building Production REST & gRPC Microservices in Go",
      channel = "Tech With Tim",
      duration = "35:10",
      category = "Fullstack",
      views = "180K views",
      url = "https://www.youtube.com/watch?v=un6ZyFkqFKo"
    )
  )

  Scaffold(
    topBar = {
      TopAppBar(
        title = { Text("Learning Feed 🧭", fontWeight = FontWeight.Bold) },
        colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background)
      )
    }
  ) { padding ->
    LazyColumn(
      modifier = Modifier
        .fillMaxSize()
        .background(MaterialTheme.colorScheme.background)
        .padding(padding)
        .padding(horizontal = 16.dp),
      verticalArrangement = Arrangement.spacedBy(16.dp),
      contentPadding = PaddingValues(top = 8.dp, bottom = 100.dp)
    ) {
      item {
        LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
          items(categories) { cat ->
            val isSelected = selectedCategory == cat
            Box(
              modifier = Modifier
                .clip(RoundedCornerShape(20.dp))
                .background(if (isSelected) BrandViolet else MaterialTheme.colorScheme.surfaceVariant)
                .clickable { selectedCategory = cat }
                .padding(horizontal = 14.dp, vertical = 8.dp)
            ) {
              Text(
                cat,
                color = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurface,
                fontWeight = FontWeight.SemiBold,
                fontSize = 12.sp
              )
            }
          }
        }
      }

      items(videos) { video ->
        PXCard(
          cornerRadius = 20.dp,
          padding = 12.dp,
          modifier = Modifier.clickable {
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(video.url))
            context.startActivity(intent)
          }
        ) {
          Box(
            modifier = Modifier
              .fillMaxWidth()
              .height(180.dp)
              .clip(RoundedCornerShape(16.dp))
              .background(Color.Black.copy(alpha = 0.85f)),
            contentAlignment = Alignment.Center
          ) {
            Icon(
              Icons.Default.PlayCircle,
              contentDescription = null,
              tint = Color.White.copy(alpha = 0.8f),
              modifier = Modifier.size(54.dp)
            )

            Box(
              modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(8.dp)
                .clip(RoundedCornerShape(4.dp))
                .background(Color.Black.copy(alpha = 0.7f))
                .padding(horizontal = 6.dp, vertical = 2.dp)
            ) {
              Text(video.duration, color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
            }
          }

          Spacer(Modifier.height(10.dp))

          Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
          ) {
            PXBadge(text = video.category)
            Text(video.views, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
          }

          Spacer(Modifier.height(6.dp))
          Text(video.title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, maxLines = 2)
          Spacer(Modifier.height(2.dp))
          Text(video.channel, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
      }
    }
  }
}
