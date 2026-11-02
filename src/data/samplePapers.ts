import { Paper } from '../types';

export const SAMPLE_PAPERS: Paper[] = [
  {
    id: 'paper-attention-2017',
    title: 'Attention Is All You Need',
    authors: 'Ashish Vaswani, Noam Shazeer, Niki Parmar, Jakob Uszkoreit, Llion Jones, Aidan N. Gomez, Łukasz Kaiser, Illia Polosukhin',
    year: '2017',
    abstract: 'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely. Experiments on two machine translation tasks show these models to be superior in quality while being more parallelizable and requiring significantly less time to train.',
    totalPages: 5,
    fileSize: 524288,
    uploadDate: '2026-10-15T10:00:00Z',
    tags: ['Transformers', 'NLP', 'Attention Mechanism', 'Deep Learning'],
    isStarred: true,
    fileName: 'attention-is-all-you-need.pdf',
    pages: [
      {
        pageNumber: 1,
        text: `Attention Is All You Need
Ashish Vaswani, Noam Shazeer, Niki Parmar, Jakob Uszkoreit, Llion Jones, Aidan N. Gomez, Łukasz Kaiser, Illia Polosukhin
Google Brain, Google Research, University of Toronto

Abstract:
The dominant sequence transduction models are based on complex recurrent or convolutional neural networks in an encoder-decoder configuration. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely. Experiments on two machine translation tasks show these models to be superior in quality while being more parallelizable and requiring significantly less time to train. Our model achieves 28.4 BLEU on the WMT 2014 English-to-German translation task, improving over the existing best results by over 2 BLEU. On the WMT 2014 English-to-French translation task, our model establishes a new single-model state-of-the-art BLEU score of 41.8 after training for 3.5 days on eight GPUs.

1. Introduction
Recurrent neural networks, notably long short-term memory (LSTM) and gated recurrent (GRU) neural networks, have been firmly established as state-of-the-art approaches in sequence modeling. Recurrent models inherently factor computation along the symbol positions of the input and output sequences. This sequentially aligned nature precludes parallelization within training examples, which becomes critical at longer sequence lengths, as memory constraints limit batching across examples. Attention mechanisms have become an integral part of compelling sequence modeling, allowing modeling of dependencies without regard to their distance in input or output sequences. In this work we propose the Transformer, a model architecture eschewing recurrence and relying entirely on an attention mechanism to draw global dependencies between input and output.`
      },
      {
        pageNumber: 2,
        text: `3. Model Architecture
Most competitive neural sequence transduction models have an encoder-decoder structure. The encoder maps an input sequence of symbol representations (x_1, ..., x_n) to a sequence of continuous representations z = (z_1, ..., z_n). Given z, the decoder then generates an output sequence (y_1, ..., y_m) of symbols one element at a time. At each step the model is auto-regressive, consuming the previously generated symbols as additional input when generating the next.

The Transformer follows this overall architecture using stacked self-attention and point-wise, fully connected layers for both the encoder and decoder.

Encoder: The encoder is composed of a stack of N = 6 identical layers. Each layer has two sub-layers. The first is a multi-head self-attention mechanism, and the second is a simple, position-wise fully connected feed-forward network. We employ a residual connection around each of the two sub-layers, followed by layer normalization. That is, the output of each sub-layer is LayerNorm(x + Sublayer(x)), where Sublayer(x) is the function implemented by the sub-layer itself. To facilitate these residual connections, all sub-layers in the model, as well as the embedding layers, produce outputs of dimension d_model = 512.

Decoder: The decoder is also composed of a stack of N = 6 identical layers. In addition to the two sub-layers in each encoder layer, the decoder inserts a third sub-layer, which performs multi-head attention over the output of the encoder stack. Similar to the encoder, we employ residual connections around each of the sub-layers, followed by layer normalization. We also modify the self-attention sub-layer in the decoder stack to prevent positions from attending to subsequent positions. This masking, combined with fact that the output embeddings are offset by one position, ensures that the predictions for position i can depend only on the known outputs at positions less than i.`
      },
      {
        pageNumber: 3,
        text: `3.2 Attention
An attention function can be described as mapping a query and a set of key-value pairs to an output, where the query, keys, values, and output are all vectors. The output is computed as a weighted sum of the values, where the weight assigned to each value is computed by a compatibility function of the query with the corresponding key.

3.2.1 Scaled Dot-Product Attention
We call our particular attention "Scaled Dot-Product Attention". The input consists of queries and keys of dimension d_k, and values of dimension d_v. We compute the dot products of the query with all keys, divide each by sqrt(d_k), and apply a softmax function to obtain the weights on the values:
Attention(Q, K, V) = softmax( (Q * K^T) / sqrt(d_k) ) * V

The two most commonly used attention functions are additive attention and dot-product (multiplicative) attention. Dot-product attention is identical to our algorithm, except for the scaling factor of 1 / sqrt(d_k). While for small values of d_k the two mechanisms behave similarly, additive attention outperforms dot-product attention without scaling for larger values of d_k. We suspect that for large values of d_k, the dot products grow large in magnitude, pushing the softmax function into regions where it has extremely small gradients. To counteract this effect, we scale the dot products by 1 / sqrt(d_k).

3.2.2 Multi-Head Attention
Instead of performing a single attention function with d_model-dimensional keys, values and queries, we found it beneficial to linearly project the queries, keys and values h times with different, learned linear projections to d_k, d_k and d_v dimensions, respectively.
MultiHead(Q, K, V) = Concat(head_1, ..., head_h) * W^O
where head_i = Attention(Q * W_i^Q, K * W_i^K, V * W_i^V)
In this work we employ h = 8 parallel attention layers, or heads. For each of these we use d_k = d_v = d_model / h = 64. Due to the reduced dimension of each head, the total computational cost is similar to that of single-head attention with full dimensionality.`
      },
      {
        pageNumber: 4,
        text: `3.5 Positional Encoding
Since our model contains no recurrence and no convolution, in order for the model to make use of the order of the sequence, we must inject some information about the relative or absolute position of the tokens in the sequence. To this end, we add "positional encodings" to the input embeddings at the bottoms of the encoder and decoder stacks. The positional encodings have the same dimension d_model as the embeddings, so that the two can be summed. There are many choices of positional encodings, learned and fixed.
In this work, we use sine and cosine functions of different frequencies:
PE(pos, 2i) = sin(pos / 10000^(2i/d_model))
PE(pos, 2i+1) = cos(pos / 10000^(2i/d_model))
where pos is the position and i is the dimension. That is, each dimension of the positional encoding corresponds to a sinusoid. The wavelengths form a geometric progression from 2*pi to 10000 * 2*pi. We chose this version because we hypothesized it would allow the model to easily learn to attend by relative positions, since for any fixed offset k, PE(pos+k) can be represented as a linear function of PE(pos).

4. Why Self-Attention
In this section we compare various aspects of self-attention layers to the recurrent and convolutional layers commonly used for mapping one variable-length sequence of symbol representations (x_1, ..., x_n) to another sequence of equal length (z_1, ..., z_n). One is the total computational complexity per layer. Another is the amount of computation that can be parallelized, measured by the minimum number of sequential operations required.
As noted in Table 1, a self-attention layer connects all positions with a constant number O(1) of sequentially executed operations, whereas a recurrent layer requires O(n) sequential operations. In terms of computational complexity, self-attention layers are faster than recurrent layers when the sequence length n is smaller than the representation dimensionality d.`
      },
      {
        pageNumber: 5,
        text: `5. Training and Results
Training Data: We trained on the standard WMT 2014 English-German dataset consisting of about 4.5 million sentence pairs. For English-French, we used the significantly larger WMT 2014 English-French dataset consisting of 36 million sentences.
Hardware and Schedule: We trained our models on one machine with 8 NVIDIA P100 GPUs. For our base models, each training step took about 0.4 seconds. We trained the base models for a total of 100,000 steps or 12 hours. For our big models, step time was 1.0 second. The big models were trained for 300,000 steps (3.5 days).
Optimizer: We used the Adam optimizer with beta_1 = 0.9, beta_2 = 0.98 and epsilon = 10^-9. We varied the learning rate over the course of training according to the formula:
lrate = d_model^(-0.5) * min(step_num^(-0.5), step_num * warmup_steps^(-1.5))
with warmup_steps = 4000.

Results: On the WMT 2014 English-to-German translation task, the big transformer model outperforms the best previously reported models (including ensembles) by more than 2.0 BLEU, establishing a new state-of-the-art BLEU score of 28.4. On the English-to-French task, our big model achieves a BLEU score of 41.8, outperforming all previously published single models at 1/4 the training cost of the previous state-of-the-art model.

6. Conclusion
In this work, we presented the Transformer, the first sequence transduction model based entirely on attention, replacing the recurrent layers most commonly used in encoder-decoder architectures with multi-headed self-attention. For translation tasks, the Transformer can be trained significantly faster than architectures based on recurrent or convolutional layers. On both WMT 2014 English-to-German and WMT 2014 English-to-French translation tasks, we achieved a new state of the art.`
      }
    ],
    notes: 'Key foundational paper. Introduced Q, K, V dot product attention scaled by 1/sqrt(d_k) and sinusoidal positional encodings. Solved sequential bottleneck of RNNs.'
  },
  {
    id: 'paper-deepseek-r1-2025',
    title: 'DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning',
    authors: 'DeepSeek-AI: Daya Guo, Dejian Yang, Haowei Zhang, Junxiao Song, Ruoyu Zhang, Runxin Xu, Qihao Zhu, Shirong Ma, Peiyi Wang, et al.',
    year: '2025',
    abstract: 'We introduce our first-generation reasoning models, DeepSeek-R1-Zero and DeepSeek-R1. DeepSeek-R1-Zero, a model trained via large-scale reinforcement learning (RL) without supervised fine-tuning (SFT) as a preliminary step, demonstrates remarkable reasoning capabilities. Through RL, DeepSeek-R1-Zero naturally emerges with numerous powerful and intriguing reasoning behaviors including self-verification, reflection, and long chain-of-thought. To address challenges such as poor readability and language mixing, we introduce DeepSeek-R1, which incorporates multi-stage training and cold-start data before RL. DeepSeek-R1 achieves performance comparable to OpenAI-o1-1217 on reasoning tasks.',
    totalPages: 4,
    fileSize: 450560,
    uploadDate: '2026-10-18T14:30:00Z',
    tags: ['Reasoning LLMs', 'Reinforcement Learning', 'GRPO', 'Cold-Start'],
    isStarred: true,
    fileName: 'deepseek-r1.pdf',
    pages: [
      {
        pageNumber: 1,
        text: `DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning
DeepSeek-AI Research Team (Hangzhou, China)

Abstract:
We introduce our first-generation reasoning models, DeepSeek-R1-Zero and DeepSeek-R1. DeepSeek-R1-Zero, a model trained via large-scale reinforcement learning (RL) without supervised fine-tuning (SFT) as a preliminary step, demonstrates remarkable reasoning capabilities. Through pure RL, DeepSeek-R1-Zero naturally emerges with numerous powerful reasoning behaviors, including self-verification, self-correction, reflection, and generating long chains of thought.
To address issues with poor readability, language mixing, and repetitive loops in DeepSeek-R1-Zero, we introduce DeepSeek-R1, which incorporates a multi-stage training pipeline including cold-start data collection before RL, followed by rejection sampling and multi-task RL.
On reasoning benchmarks, DeepSeek-R1 achieves performance on par with OpenAI-o1-1217: 79.8% Pass@1 on AIME 2024, 97.3% on MATH-500, and 2029 Elo rating on Codeforces.`
      },
      {
        pageNumber: 2,
        text: `2. DeepSeek-R1-Zero: Pure Reinforcement Learning
We first explore the potential of LLMs to develop reasoning capabilities without any supervised data, focusing on self-evolution through a pure RL process.
Reinforcement Learning Algorithm:
To save training costs, we employ Group Relative Policy Optimization (GRPO), which foregoes the critic model typically of the same size as the policy model, and instead estimates the baseline from group scores. Specifically, for each question q, GRPO samples a group of outputs {o_1, o_2, ..., o_G} from the old policy and maximizes the objective function using normalized advantage calculated over the group rewards.

Reward Modeling:
The reward is the source of the training signal in RL. To avoid reward hacking and training instability, we use a rule-based reward system consisting primarily of:
1. Accuracy Rewards: Evaluates whether the response is correct. For math tasks with deterministic answers (e.g. boxed numbers), the model is required to provide the final answer within a designated format, enabling automated rule-based verification. For coding tasks, we execute unit tests against generated solutions.
2. Format Rewards: Enforces the model to put its thinking process between <think> and </think> delimiters.
Crucially, we do NOT use an outcome neural reward model, as neural reward models suffer from reward hacking in large-scale RL.`
      },
      {
        pageNumber: 3,
        text: `3. Emergence of Self-Correction and "Aha" Moments
During the training of DeepSeek-R1-Zero, we observed spontaneous emergence of advanced reasoning dynamics as RL training steps increased.
Without any human demonstrations:
- Thinking time increased dramatically from hundreds of tokens to thousands of tokens.
- The model spontaneously began re-evaluating its intermediate calculations, stating phrases like "Wait, let me double check this derivation..." or "Ah, actually my previous assumption was incorrect, because...".
- This "Aha moment" proves that reinforcement learning can directly incentivize cognitive search and self-correction without imitation learning.

However, DeepSeek-R1-Zero had major drawbacks:
1. Language mixing: An English prompt would sometimes trigger Chinese thought tokens and vice versa.
2. Readability: Unconstrained streams of consciousness were chaotic and hard for humans to follow.
3. Formatting failures: Sometimes repeating endless loops of verification.`
      },
      {
        pageNumber: 4,
        text: `4. DeepSeek-R1 Pipeline: Multi-Stage Training
To resolve DeepSeek-R1-Zero's flaws while retaining reasoning power, we designed a 4-stage pipeline:
Stage 1: Cold-Start Data. We collected thousands of high-quality long-chain-of-thought demonstrations with clear structure, readable formatting, and verified answers to initialize the base model.
Stage 2: Reasoning-Oriented RL. We applied GRPO with both accuracy and language consistency rewards to enhance mathematical, scientific, and coding abilities.
Stage 3: Rejection Sampling & SFT. We sampled 600k reasoning trajectories from the RL checkpoint, filtered out incorrect or poorly written ones, and combined them with 200k non-reasoning general domain instruction data for supervised fine-tuning.
Stage 4: Secondary RL for All Scenarios. A final RL stage aligning the model for helpfulness, safety, and preference satisfaction.

Distillation to Smaller Models:
We distilled DeepSeek-R1's reasoning data directly into smaller dense models (Qwen-2.5 and Llama-3.1 from 1.5B to 70B). The distilled 14B model surpassed proprietary models like o1-mini on several math and reasoning benchmarks, proving that reasoning trajectories can be transferred without running massive RL from scratch.`
      }
    ],
    notes: 'Proved pure RL (GRPO) without SFT produces emergent self-correction and reflection. Solved reward hacking by avoiding neural reward models and using rule-based math/code verification.'
  },
  {
    id: 'paper-lora-2021',
    title: 'LoRA: Low-Rank Adaptation of Large Language Models',
    authors: 'Edward J. Hu, Yelong Shen, Phillip Wallis, Zeyuan Allen-Zhu, Yuanzhi Li, Shean Wang, Lu Wang, Weizhu Chen (Microsoft Corporation)',
    year: '2021',
    abstract: 'An important paradigm of natural language processing consists of large-scale pre-training on general domain data and adaptation to specific tasks or domains. As we pre-train larger models, full fine-tuning, which retrains all model parameters, becomes infeasible. We propose Low-Rank Adaptation, or LoRA, which freezes the pre-trained model weights and injects trainable rank decomposition matrices into each layer of the Transformer architecture, greatly reducing the number of trainable parameters for downstream tasks.',
    totalPages: 4,
    fileSize: 419430,
    uploadDate: '2026-10-20T08:15:00Z',
    tags: ['PEFT', 'LoRA', 'Model Adaptation', 'Efficiency'],
    isStarred: false,
    fileName: 'lora-low-rank-adaptation.pdf',
    pages: [
      {
        pageNumber: 1,
        text: `LoRA: Low-Rank Adaptation of Large Language Models
Edward J. Hu, Yelong Shen, Phillip Wallis, Zeyuan Allen-Zhu, Yuanzhi Li, Shean Wang, Lu Wang, Weizhu Chen
Microsoft Corporation

Abstract:
An important paradigm of natural language processing consists of large-scale pre-training on general domain data and adaptation to specific tasks or domains. As we pre-train larger models, full fine-tuning, which retrains all model parameters, becomes infeasible. Taking GPT-3 175B as an example — deploying independent instances of fine-tuned models, each with 175B parameters, is prohibitive.
We propose Low-Rank Adaptation, or LoRA, which freezes the pre-trained model weights and injects trainable rank decomposition matrices into each layer of the Transformer architecture, greatly reducing the number of trainable parameters for downstream tasks. Compared to fine-tuning GPT-3 175B with Adam, LoRA can reduce the number of trainable parameters by 10,000 times and the GPU memory requirement by 3 times. LoRA performs on-par or better than fine-tuning in model quality on RoBERTa, DeBERTa, GPT-2, and GPT-3, despite having fewer trainable parameters, a higher training throughput, and, unlike adapters, no additional inference latency.`
      },
      {
        pageNumber: 2,
        text: `2. Problem Statement & Motivation
While transfer learning has revolutionized NLP, fine-tuning large models presents significant deployment challenges. For a 175B model, storing multiple fine-tuned models requires hundreds of gigabytes per task. Moreover, during serving, swapping entire weight matrices between distinct customer requests causes severe latency overhead.
Existing parameter-efficient fine-tuning approaches introduce notable trade-offs:
- Series adapters introduce sequential compute layers, increasing inference latency by 20-30% on small batch sizes.
- Prefix tuning is difficult to optimize and reduces the usable context window length.
We ask: Can we achieve parameter-efficient adaptation while preserving both model quality and zero inference latency?`
      },
      {
        pageNumber: 3,
        text: `3. Method: Low-Rank Adaptation (LoRA)
Inspired by Aghajanyan et al. (2020) showing that pre-trained language models have a low "intrinsic dimension", we hypothesize that the weight updates Delta W during task adaptation also have a low intrinsic rank r << min(d, k).
For a pre-trained weight matrix W_0 in R^(d x k), we constrain its update by representing Delta W with a low-rank decomposition:
W = W_0 + Delta W = W_0 + B * A
where B in R^(d x r), A in R^(r x k), and the rank r << min(d, k).
During training, W_0 is frozen and does not receive gradient updates, while A and B contain trainable parameters. Note that both W_0 and Delta W = B * A are multiplied by the same input x:
h = W_0 * x + Delta W * x = W_0 * x + (alpha / r) * B * A * x
Initialization:
We use a random Gaussian initialization for A and zero for B, so Delta W = B * A is zero at the beginning of training. We then scale Delta W * x by alpha / r, where alpha is a constant hyperparameter.

Zero Additional Inference Latency:
When deployed in production, we can explicitly compute and store W = W_0 + B * A and perform inference as usual. When switching to another downstream task, we can recover W_0 by subtracting B * A and adding the new task's B' * A', introducing zero memory or latency overhead during runtime.`
      },
      {
        pageNumber: 4,
        text: `4. Empirical Results & Analysis
We evaluate LoRA on RoBERTa, DeBERTa, and GPT-3 175B across GLUE, WikiSQL, and SAMSum benchmarks.
On GPT-3 175B:
- Full fine-tuning trains 175,255.8 million parameters.
- LoRA with rank r = 4 on W_q and W_v trains only 4.7 million parameters (a 37,000x reduction).
- LoRA matches or exceeds full fine-tuning performance (e.g. WikiSQL: 73.8% vs 73.4%; SAMSum: 53.8 Rouge-1 vs 52.0).

Which Weight Matrices in Transformer Should We Apply LoRA To?
We restricted our study to adapting attention weights (W_q, W_k, W_v, W_o). We found that adapting both W_q and W_v with a low rank (such as r = 4 or r = 8) yields the best balance between parameter efficiency and accuracy. Adapting all attention matrices yields superior results compared to adapting only W_q with higher rank.`
      }
    ],
    notes: 'Breakthrough parameter-efficient fine-tuning (PEFT) method. Decomposes weight updates Delta W into B * A where r << d. Zero inference latency because weights can be merged into W_0.'
  }
];
